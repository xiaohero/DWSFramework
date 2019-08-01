/**本框架文件乃自研"DWS框架"简化版(脱机,离线版),
 * 如需商业用途请咨询开发作者,
 * 可获取完整版(支持websocket实时通信，支持https转http，支持去服务端iframe保护,
 * 支持前端后端消息转发,支持后端全局变量存取,支持获取插件唯一id,支持http request,
 * http response head,body等截取,还自动集成了常用第三方前端js库:如jquery,babel,react,vue等
 * )并持续更新维护:2019-07-31 作者:西大神(QQ:2130622841)
 * **/

/**chrome扩展动态js注入工具类(通用后台基类)**/
class BaseChmExtBg {
    constructor() {
        // if (this.getFrontJs === BaseChmExtBg.prototype.getFrontJs) {
        //     throw new TypeError("Please implement abstract method getFrontJs.");
        // }
        this.globalSenders = {};
        this.curSender = null;
        this.initListenEvent();
    }

    getFrontJs(notEncodeURI=false) {
        let ads="console.log('本框架文件乃自研<DWS框架>简化版(脱机,离线版),\n * 如需商业用途请咨询开发作者,\n* 可获取完整版(支持websocket实时通信，支持https转http，支持去服务端iframe保护,\n* 支持前端后端消息转发,支持后端全局变量存取,支持获取插件唯一id,支持http request,\n* http response head,body等截取,还自动集成了常用第三方前端js库:如jquery,babel,react,vue等\n* )并持续更新维护:2019-07-31 作者:西大神(QQ:2130622841)');";
        return "console.log('dws简化版框架不支持动态获取前端js,如有完整版需求,请联系开发作者购买!');";
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

    getTabByUrl(tabUrl, callback, byCache = true) {
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
            //alert('chrome_ext_bg 收到页面消息:' + JSON.stringify(request) + ' 执行函数:' + request.funcName + ',typeof:' + typeof this[request.funcName]);
            if ('function' != typeof this[request.funcName]) {
                alert('chrome_ext_bg error:invoke unkown method:' + request.funcName + ',self:' + JSON.stringify(this));
                callback('chrome_ext_bg error:invoke unkown method:' + request.funcName);
                return;
            }
            let exeResult = '';
            this.curSender = sender;
            this.onSenderRecieve(sender);
            if ('jsCode' == request.varName) {
                exeResult = window.eval(request.varValue);
            } else {
                // this[request.funcName].apply(this, request);
                exeResult = this[request.funcName](request);
            }
            //alert('chrome_ext_bg:' + request.funcName + ':result:' + JSON.stringify(exeResult)+',type:'+typeof exeResult);
            //注意这里讲返回值json_encode,以便前台eval参数解析为js变量
            callback(JSON.stringify(exeResult));
        });
        //监听页面关闭事件,清理globalSenders缓存
        chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
            for (let eachUrl in this.globalSenders) {
                if (tabId == this.globalSenders[eachUrl].tab.id) {
                    delete this.globalSenders[eachUrl];
                    break;
                }
            }
        });
    }

    nothing(request) {
        //空壳函数，不能删
    }

    sleepSyncPromise(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    enableNetworkMonitorByUrl(dstUrl, requestMatchReg = '', responseMatchReg = '', cbFunc, autoDetach = true,returnUrlEncode=true) {
        requestMatchReg = ('string' === typeof requestMatchReg && requestMatchReg) ? new RegExp(requestMatchReg) : '';
        responseMatchReg = ('string' === typeof responseMatchReg && responseMatchReg) ? new RegExp(responseMatchReg) : '';
        if (!dstUrl || !requestMatchReg || !responseMatchReg) {
            return false;
        }
        let curSender = this.getSenderByUrl(dstUrl);
        if (curSender && curSender.nwEnable) {
            this.logToCurSender('当前tab页已激活网络监控,跳过:' + JSON.stringify(curSender));
            return true;
        }
        //记录需要捕获流量的requestId
        let targetRequestIds = {};
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
                                    let urlMatchRet = params.request.url.match(requestMatchReg);
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
            );
        });
    }

    disableNetworkMonitorByUrl(url, cbFunc = () => {
    }) {
        this.getTabByUrl(url, (findTab) => {
            if (!findTab) {
                alert('detach失败,未找到tab:' + url);
                return;
            }
            this.disableNetworkMonitorByTabId(findTab.id, cbFunc);
        });
    }

    disableNetworkMonitorByTabId(tabId, cbFunc = () => {
    }) {
        chrome.debugger.detach({
            tabId: tabId
        }, () => {
            cbFunc();
            //alert('关闭调试成功!');
        });
    }
}
;/**DWS chrome通用插件: 后台**/
class DwsChmExtBg extends BaseChmExtBg {
    constructor() {
        super();
        this.upPrjName = ('undefined' !== typeof dwsServPrjName ? dwsServPrjName : 'DJXXX');
        //其它业务参数
        this.enableBgDebug = false;
        //初始化
        this.init();
    }

    init() {
        this.createContextMenus();
    }

    setExtErrMsg(request) {
        return 'undefined' !== typeof dwsStatusInfo ? dwsStatusInfo['errTxt'] = request['varValue'] : false;
    }

    getCurServUrl() {
        return 'function' === typeof getCurServInfo ? getCurServInfo()[0] : "";
    }

    createContextMenus(request) {
        //测试菜单
        chrome.contextMenus.create({
            id: 'switchBgDebug',
            type: 'normal',
            title: '切换插件调试模式',
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.enableBgDebug = !this.enableBgDebug;
                alert('切换成功,当前调试开关(' + this.enableBgDebug + '):' + this.getClientExtId());
            }
        });
    }

    getServUrlList() {
        return 'undefined' === typeof servUrlList ? {} : servUrlList;
    }

    setGlbErrTxt(errTxt) {
        dwsStatusInfo.errInfo = errTxt;
    }

    isSelfServPage(targetUrl) {
        let selfServUrlKeywords = this.upPrjName + '/';
        if (targetUrl && 'string' == typeof targetUrl) {
            return -1 !== targetUrl.indexOf(selfServUrlKeywords) ? true : false;
        }
        return -1 !== window.location.href.indexOf(selfServUrlKeywords) ? true : 0;
    }

    //重写父类方法，自动纠正主页面iframe嵌套的目标sender
    onSenderRecieve(sender) {
        if (!sender || !sender.url || !sender.tab) {
            return false;
        }
        if (!this.isSelfServPage(sender.url)) {
            return super.onSenderRecieve(sender);//非iframe嵌套的按照父类处理
        }
        if (this.globalSenders[sender.url] && this.globalSenders[sender.url].tab.id == sender.tab.id && this.globalSenders[sender.url].frameId) {
            if ('loading' != sender.tab.status) {
                //loading表示页面刷新了
                // alert('无变化?:'+JSON.stringify(sender));
                return true;//无变化,不作处理,直接返回
            }
            this.globalSenders[sender.url].frameId = 0;//重置frameId,刷新说明老frameId已失效
        }
        if (!sender.frameId) {
            // alert('检测到iframe嵌套，sender错误!' + JSON.stringify(sender));
        }
    }

    /////////////////////////业务相关方法////////////////
}
dwsChmExtBg = new DwsChmExtBg();



