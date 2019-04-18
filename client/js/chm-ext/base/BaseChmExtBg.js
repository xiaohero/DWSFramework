/**chrome扩展动态js注入工具类(通用后台基类)**/
class BaseChmExtBg {
    constructor() {
        // if (this.getFrontJs === BaseChmExtBg.prototype.getFrontJs) {
        //     throw new TypeError("Please implement abstract method getFrontJs.");
        // }
        this.globalSenders = {};
        this.globalVars = {};
        this.curSender = null;
        this.bgListenEvent();

        //控制https转http开关
        this.enableHttpstoHttp = false;
        this.latestHttpUrl='';
        //插件id
        this.clientExtId='';
        this.initClientExtId();
    }

    //已过时:注意该函数有可能不准确
    sendJsToCurSender(jsCode) {
        if (!this.curSender || !this.curSender.tab) {
            return false;
        }
        this.sendJsToPage(this.curSender.tab.id, this.curSender.frameId, jsCode);
        return true;
    }

    sendJsToPageByUrl(targetUrl, jsCode, byCache) {
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

    //子类可重新改方法
    onSenderRecieve(sender) {
        if (sender && sender.url) {
            this.globalSenders[sender.url] = sender;
        }
    }

    getTabByUrl(tabUrl, callback, byCache) {
        if (byCache && this.globalSenders[tabUrl] && this.globalSenders[tabUrl].tab) {
            return callback(this.globalSenders[tabUrl].tab);
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
                return;
            }
            //fixme:这里可以再更新一下缓存内容
            callback(targetTab);
        });
    }

    bgListenEvent() {
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

    getFrontJs() {
        let frontJs = BaseChmExtFt.toString() + ';var baseChmExtFt=new BaseChmExtFt();';//var级别变量作用域更广，其它地方可以调用
        frontJs = encodeURI(frontJs);
        return frontJs;
    }

    getClientUuid() {
        return chrome.runtime.getURL('');
    }

    genRandomToken(keyLen) {
        // E.g. 8 * 32 = 256 bits token
        let randomPool = new Uint8Array(keyLen);
        crypto.getRandomValues(randomPool);
        let hex = '';
        for (let i = 0; i < randomPool.length; ++i) {
            hex += randomPool[i].toString(16);
        }
        // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
        return hex;
    }

    getClientExtId(){
        if(!this.clientExtId){
            this.initClientExtId();
        }
        return this.clientExtId;
    }

    initClientExtId() {
        chrome.storage.sync.get('chmId', (items)=>{
            let chmId = items.chmId;
            if (chmId) {
                this.clientExtId=chmId;
                return;
            }
            chmId = this.genRandomToken(10);
            chrome.storage.sync.set({chmId: chmId}, () => {
                this.clientExtId=chmId;
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
                    if (('object' == typeof details) && ('undefined' != typeof details.type && 'undefined' != typeof details.url)) {
                        let newUrl = details.url;
                        if (-1 !== newUrl.indexOf('https://') && -1 === newUrl.indexOf('.js') && -1 === newUrl.indexOf('.xml')) {
                            newUrl = newUrl.replace('https://', 'http://');
                        } else if (-1 !== newUrl.indexOf('wss://')) {
                            newUrl = newUrl.replace('wss://', 'ws://');
                        }
                        if (newUrl !== details.url) {
                            //alert('老url:' + details.url + ',新url:' + newUrl+',上次url:'+this.latestHttpUrl);
                            //判断此次跳转的url是否与上次相同，防止循环重定向
                            if(newUrl===this.latestHttpUrl){
                                //alert('检测到循环重定向，终止操作!');
                                return;
                            }
                            // details.url=newUrl;
                            //保存最近一次http url
                            this.latestHttpUrl=newUrl;
                            return {redirectUrl: newUrl};
                        }
                    }
                }
            },
            {urls: ['<all_urls>'], types: ['main_frame', 'xmlhttprequest', 'websocket']},
            ['blocking']
            //blocking:表明同步阻塞，以便能控制请求cancel或redirect
            // ['blocking','requestBody']
        );
    }
}