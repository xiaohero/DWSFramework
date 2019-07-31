/**chrome扩展动态js注入工具类(通用后台基类)**/
class BaseChmExtBg {
    constructor() {
        // if (this.getFrontJs === BaseChmExtBg.prototype.getFrontJs) {
        //     throw new TypeError("Please implement abstract method getFrontJs.");
        // }
        this.globalSenders = {};
        this.globalVars = {};
        this.curSender = null;
        this.initListenEvent();

        //控制https转http开关
        this.enableHttpstoHttp = false;
        this.latestHttpUrl = '';
        //插件id
        this.clientExtId = '';
        this.initClientExtId();
    }

    //已过时:注意该函数有可能不准确
    sendJsToCurSender(jsCode) {
        if (!this.curSender || !this.curSender.tab) {
            return false;
        }
        return this.sendJsToPage(this.curSender.tab.id, this.curSender.frameId, jsCode);
    }

    logToCurSender(logMsg) {
        let jsCode = "console.log('后台调试:" + logMsg + "');";
        if (!this.curSender || !this.curSender.tab) {
            return false;
        }
        return this.sendJsToPage(this.curSender.tab.id, this.curSender.frameId, jsCode);
    }

    sendJsToPageByUrl(targetUrl, jsCode, byCache=true) {
        let targetSender = (byCache ? this.getSenderByUrl(targetUrl) : null);
        // alert('从缓存获取：' + targetSender+','+ targetUrl+',allSender:'+JSON.stringify(this.globalSenders));
        if (targetSender && targetSender.tab) {
            return this.sendJsToPage(targetSender.tab.id, targetSender.frameId, jsCode);
        }
        this.getTabByUrl(targetUrl, (tab) => {
            // alert('从ext获取：'+ JSON.stringify(tab)+','+ targetUrl);
            if (tab) {
                return this.sendJsToPage(tab.id, 0, jsCode);
            }
        });
    }

    sendJsToPage(tabId, frameId, jsCode) {
        if (!tabId) {
            return false;
        }
        frameId ? chrome.tabs.executeScript(tabId, {code: jsCode, frameId: frameId}, (result) => {
        }) : chrome.tabs.executeScript(tabId, {code: jsCode}, (result) => {
        });
        return true;
    }

    getAllTabs(callback) {
        chrome.tabs.query({}, (tabs) => {
            callback(tabs);
        });
    }

    getSenderByUrl(tabUrl) {
        if (!this.globalSenders[tabUrl]) {
            return false;
        }
        return this.globalSenders[tabUrl];
    }

    //子类可重写改方法
    onSenderRecieve(sender) {
        if (sender && sender.url) {
            if ('object' === typeof this.globalSenders[sender.url]) {
                sender.nwEnable = ('boolean' === typeof this.globalSenders[sender.url].nwEnable && this.globalSenders[sender.url].nwEnable) ? true : false;
            }
            this.globalSenders[sender.url] = sender;
        }
    }

    getTabByUrl(tabUrl, callback, byCache=true) {
        if ('function' !== typeof callback) {
            return false;
        }
        if ('string' !== typeof tabUrl) {
            callback(false);
            return false;
        }
        if (byCache && this.globalSenders[tabUrl] && this.globalSenders[tabUrl].tab) {
            callback(this.globalSenders[tabUrl].tab);
            return this.globalSenders[tabUrl].tab;
        }
        //'https://www.okex.com/spot/trade#product*'
        //注意:url种带有#的匹配不出来
        let queryInfo = (-1 !== tabUrl.indexOf('#') ? {} : {url: tabUrl});
        chrome.tabs.query(queryInfo, (tabs) => {
            // alert('getTabByUrl:targetUrl:' + tabUrl + ',findTabs:' + JSON.stringify(tabs));
            let targetTab = null;
            if (tabs && tabs.length > 0) {//有多个匹配的时候再跟进url完整匹配一次
                for (let idx in tabs) {
                    if (tabUrl == tabs[idx].url) {
                        //fixme:可能要考虑多个匹配的情况
                        targetTab = tabs[idx];
                        break;
                    }
                }
            }
            if (!targetTab) {
                // alert('未找到指定tab,目标url:' + tabUrl + ',query:' + JSON.stringify(queryInfo) + ',curSender:' + JSON.stringify(this.curSender));
                this.getAllTabs((tabs) => {
                    // alert('all_tabs:' + JSON.stringify(tabs));
                });
                callback(false);
                return false;
            }
            //fixme:这里可以再更新一下缓存内容
            callback(targetTab);
        });
    }

    initListenEvent() {
        //监听后台事件
        chrome.runtime.onMessage.addListener((request, sender, callback) => {
            // alert('chrome_ext_bg 收到页面消息:' + JSON.stringify(request) + ' 执行函数:' + request.funcName + ',typeof:' + typeof this[request.funcName]);
            if ('function' != typeof this[request.funcName]) {
                alert('chrome_ext_bg error:invoke unkown method:' + request.funcName + ',self:' + JSON.stringify(this));
                callback('chrome_ext_bg error:invoke unkown method:' + request.funcName);
                return;
            }
            let exeResult = '';
            this.curSender = sender;
            this.onSenderRecieve(sender);
            if ('jsCode' == request.varName) {
                // alert('chrome_ext_bg动态执行js:'+request.varValue+',type:'+typeof request.varValue);
                exeResult = window.eval(request.varValue);
                // alert(request.varValue+',执行结果:'+exeResult);
            } else {
                // this[request.funcName].apply(this, request);
                exeResult = this[request.funcName](request);
            }
            // alert('chrome_ext_bg:' + request.funcName + ':result:' + JSON.stringify(exeResult)+',type:'+typeof exeResult);
            //注意这里讲返回值json_encode,以便前台eval参数解析为js变量
            callback(JSON.stringify(exeResult));
        });
        //监听页面关闭事件,清理globalSenders缓存
        chrome.tabs.onRemoved.addListener( (tabId, removeInfo)=>{
            for (let eachUrl in this.globalSenders) {
                if(tabId==this.globalSenders[eachUrl].tab.id){
                    delete this.globalSenders[eachUrl];
                    break;
                }
            }
        });
    }

    getGlobalVar(request) {
        // alert('chrome_ext_bg:getGlobalVar:key:'+request.varName+',value:'+this.globalVars[request.varName]);
        // return localStorage.getItem(request.varName);
        return 'undefined' == typeof this.globalVars[request.varName] ? null : this.globalVars[request.varName];
    }

    setGlobalVar(request) {
        // alert('chrome_ext_bg:setGlobalVar:key:'+request.varName+',value:'+request.varValue);
        // return localStorage.setItem(request.varName, request.varValue);
        return this.globalVars[request.varName] = request.varValue;
    }

    nothing(request) {
        //空壳函数，不能删
    }

    sleepSyncPromise(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getFrontJs(notEncodeURI=false) {
        // let frontJs = BaseChmExtFt.toString() + ';var baseChmExtFt=new BaseChmExtFt();';//var级别变量作用域更广，其它地方可以调用
        let frontJs = BaseChmExtFt.toString();//var级别变量作用域更广，其它地方可以调用
        !notEncodeURI ? frontJs = encodeURI(frontJs) : false;
        return frontJs;
    }

    getClientUuid() {
        return chrome.runtime.getURL('');
    }

    genRandomToken(keyLen) {
        let randomPool = new Uint8Array(keyLen);
        crypto.getRandomValues(randomPool);
        let hex = '';
        for (let i = 0; i < randomPool.length; ++i) {
            hex += randomPool[i].toString(16);
        }
        return hex;
    }

    getClientExtId() {
        if (!this.clientExtId) {
            this.initClientExtId();
        }
        return this.clientExtId;
    }

    initClientExtId() {
        chrome.storage.sync.get('chmId', (items) => {
            let chmId = items.chmId;
            if (chmId) {
                this.clientExtId = chmId;
                return;
            }
            chmId = this.genRandomToken(10);
            chrome.storage.sync.set({chmId: chmId}, () => {
                this.clientExtId = chmId;
                return chmId
            });
        });
    }

    removeIframeDisable() {
        let HEADERS_TO_STRIP_LOWERCASE = [
            'content-security-policy',
            'x-frame-options',
        ];
        chrome.webRequest.onHeadersReceived.addListener((details) => {
                //alert('responseHeaders:' + JSON.stringify(details.responseHeaders));
                return {
                    responseHeaders: details.responseHeaders.filter(function (header) {
                        return HEADERS_TO_STRIP_LOWERCASE.indexOf(header.name.toLowerCase()) < 0;
                    })
                };
            }, {
                types: ['sub_frame'],
                urls: ['<all_urls>']
            }, ['blocking', 'responseHeaders']
        );
    }

    redirectHttpsToHttp() {
        //参考文档: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
        chrome.webRequest.onBeforeRequest.addListener((details) => {
                //details.type:websocket,main_frame,xmlhttprequest,other
                //details.tabId
                //alert('Debug:' + JSON.stringify(details));
                //返回值只能是{cancel:xx}或{redirectUrlOptional:xx}
                if (this.enableHttpstoHttp) {
                    if (('object' === typeof details) && ('undefined' !== typeof details.type && 'undefined' !== typeof details.url)) {
                        let newUrl = details.url;
                        if (-1 !== newUrl.indexOf('https://') && -1 === newUrl.indexOf('.js') && -1 === newUrl.indexOf('.xml')) {
                            newUrl = newUrl.replace('https://', 'http://');
                        } else if (-1 !== newUrl.indexOf('wss://')) {
                            newUrl = newUrl.replace('wss://', 'ws://');
                        }
                        if (newUrl !== details.url) {
                            //alert('老url:' + details.url + ',新url:' + newUrl+',上次url:'+this.latestHttpUrl);
                            //判断此次跳转的url是否与上次相同，防止循环重定向
                            if (newUrl === this.latestHttpUrl) {
                                //alert('检测到循环重定向，终止操作!');
                                return;
                            }
                            // details.url=newUrl;
                            //保存最近一次http url
                            this.latestHttpUrl = newUrl;
                            return {redirectUrl: newUrl};
                        }
                    }
                }
            },
            {urls: ['<all_urls>'], types: ['main_frame', 'xmlhttprequest', 'websocket']},
            ['blocking']
            //blocking:表明同步阻塞，以便能控制请求cancel或redirect
            //['blocking','requestBody']
        );
    }

    enableNetworkMonitorByUrl(dstUrl, requestMatchReg='', responseMatchReg='',cbFunc,autoDetach=true,returnUrlEncode=true) {
        requestMatchReg = ('string' === typeof requestMatchReg && requestMatchReg) ? new RegExp(requestMatchReg) : '';
        responseMatchReg = ('string' === typeof responseMatchReg && responseMatchReg) ? new RegExp(responseMatchReg) : '';
        if (!dstUrl||!requestMatchReg||!responseMatchReg) {
            return false;
        }
        let curSender=this.getSenderByUrl(dstUrl);
        if(curSender&&curSender.nwEnable){
            this.logToCurSender('当前tab页已激活网络监控,跳过:'+JSON.stringify(curSender));
            return true;
        }
        //记录需要捕获流量的requestId
        let targetRequestIds={};
        //alert('匹配requestMatchReg:'+requestMatchReg+',responseMatchReg:'+responseMatchReg+',目标url:'+dstUrl);
        this.getTabByUrl(dstUrl, (findTab) => {
            if (!findTab) {
                alert('监控网络失败,未找到tab:' + dstUrl);
                return;
            }
            //alert('找到tab:' + JSON.stringify(findTab));
            let attachVersion = '1.0';
            //激活调试当前tab
            chrome.debugger.attach({
                    tabId: findTab.id
                }, attachVersion,
                ((tmpTabId, tmpUrl) => {
                    return () => {
                        // this.disableNetworkMonitorByUrl(tmpUrl);
                        //开启网络监控
                        chrome.debugger.sendCommand({
                            tabId: tmpTabId
                        }, 'Network.enable', (result) => {
                            curSender ? this.globalSenders[dstUrl].nwEnable = true : false;
                            //监听网络流量
                            chrome.debugger.onEvent.addListener((source, method, params) => {
                                //method:Network.requestWillBeSent,Network.dataReceived,Network.loadingFinished,Network.responseReceived
                                //params.type:Script,XHR,Image
                                if (source.tabId !== tmpTabId) {
                                    return;
                                }
                                //过滤标示需要捕获流量的requestId
                                if ('Network.requestWillBeSent' == method && 'request' in params && 'url' in params.request && params.request.url) {
                                    let urlMatchRet=params.request.url.match(requestMatchReg);
                                    urlMatchRet ? targetRequestIds[params.requestId] = params.requestId : false;
                                    //urlMatchRet && this.logToCurSender('requestWillBeSent:'+params.request.url+',isMatch:'+urlMatchRet[0]+',requestId:'+params.requestId+',responseMatchReg:'+responseMatchReg);
                                }
                                //网络加载完成后再去获取数据，否则可能抓取的数据不全(丢失部分)
                                if ('Network.loadingFinished' == method && params.requestId in targetRequestIds) {
                                    //this.logToCurSender('loadingFinished:'+JSON.stringify(params)+',requestId:'+params.requestId);
                                    chrome.debugger.sendCommand({
                                        tabId: tmpTabId
                                    }, 'Network.getResponseBody', {
                                        'requestId': params.requestId
                                    }, (response) => {
                                        if ('object' !== typeof response) {
                                            return;
                                        }
                                        if (responseMatchReg && response.body) {
                                            //this.logToCurSender('getResponseBody:'+response.body+',requestId:'+params.requestId);
                                            let findRet = ('/true/' === '' + responseMatchReg) ? [response.body] : response.body.match(responseMatchReg);
                                            // alert('dstUrl:' + dstUrl + ',hit:' + responseMatchReg + ',findRet:' + JSON.stringify(findRet) + ',response_body:' + response.body);
                                            if (findRet) {
                                                findRet = returnUrlEncode ? encodeURI(findRet[0]) : findRet[0];
                                                'function' === typeof cbFunc ? cbFunc(dstUrl,findRet) : alert(findRet);
                                                //alert('dstUrl:'+dstUrl+',hit:'+responseMatchReg+',findRet:'+findRet);
                                                //this.logToCurSender(findRet);
                                                //以防url变化，通过tabid解绑
                                                if (autoDetach) {
                                                    this.disableNetworkMonitorByTabId(tmpTabId);
                                                    curSender ? this.globalSenders[dstUrl].nwEnable = false : false;
                                                }
                                            }
                                            //已激活的标签页缓存下来
                                            // let sender = this.getSenderByUrl(dstUrl);
                                            // sender ? sender.nwEnable = nwCacheEnable : false;
                                        }

                                    });
                                }
                            });
                        });
                    }
                })(findTab.id, dstUrl)
            )
        });
    }

    disableNetworkMonitorByUrl(url,cbFunc=()=>{}) {
        this.getTabByUrl(url, (findTab) => {
            if (!findTab) {
                alert('detach失败,未找到tab:' + url);
                return;
            }
            this.disableNetworkMonitorByTabId(findTab.id,cbFunc);
        });
    }

    disableNetworkMonitorByTabId(tabId,cbFunc=()=>{}) {
        chrome.debugger.detach({
            tabId: tabId
        }, () => {
            cbFunc();
            //alert('关闭调试成功!');
        });
    }
}