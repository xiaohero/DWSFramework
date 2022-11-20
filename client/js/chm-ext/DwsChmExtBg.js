/**DWS chrome universal extension: background**/
class DwsChmExtBg extends BaseChmExtBg {
    constructor() {
        super();
        this.upPrjName = ('undefined' !== typeof dwsServPrjName ? dwsServPrjName : 'DJXXX');
        this.bgWebSocket = null;

        //Other business parameters
        this.enableBgDebug = false;
        //others
        this.ajaxUtil=ajaxUtil;
        //js for popup
        this.jsToPopUp = '';
        //init
        this.init();
    }

    init() {
        this.removeIframeDisable();
        this.redirectHttpsToHttp();
        this.createContextMenus();
        this.startBgWebSocket();
    }

    startBgWebSocket() {
        let curServUrl = this.getCurServUrl();
        if (!curServUrl || '0' == curServUrl || 'string' != typeof curServUrl) {
            return;
        }
        //fixme:Consider whether the last connection needs to be manually disconnected?
        curServUrl = curServUrl.replace('http:', 'ws:');
        //Connect to the ws server in the background
        this.bgWebSocket = new DwsWebSocket(curServUrl, '', 0, this.upPrjName);
        this.bgWebSocket.init();
    }

    getBgWebSocket() {
        return this.bgWebSocket;
    }

    setExtErrMsg(request) {
        return 'undefined' !== typeof dwsStatusInfo ? dwsStatusInfo['errTxt'] = request['varValue'] : false;
    }

    flushParentWindowByFrameUrl(frameUrl) {
        if (!frameUrl) {
            return;
        }
        let frameSender = this.getSenderByUrl(frameUrl);
        if (!frameSender) {
            return;
        }
        for (let url in this.globalSenders) {
            if (url != frameUrl && frameSender == this.globalSenders[url]) {
                // alert('Find the target tab refresh:'+JSON.stringify(this.globalSenders[url]));
                chrome.tabs.update(this.globalSenders[url].tab.id, {
                    url: this.globalSenders[url].tab.url,
                    selected: this.globalSenders[url].tab.selected
                });
            }
            break;
        }
    }

    getWebSocket() {
        return this.bgWebSocket;
    }

    exeJsToPageFrame(tabUrl, iframeName, iframeJsCode) {
        chrome.tabs.query({url: tabUrl, active: true}, (tabs) => {
            // alert(JSON.stringify(tabs));
            if (tabs) {
                chrome.tabs.executeScript(tabs[0].id, {
                    // if (window.frames['myIframe']){alert(window.frames['myIframe'].location.href);}
                    // code:"alert(window.frames['myIframe'].location.href)",
                    code: "(()=>{if('" + iframeName + "'==window.name){return window.location.href;}})()",
                    allFrames: true
                }, (results) => {
                    for (let idx in results) {
                        if (results[idx]) {
                            // alert('correct return value:' + results[idx]);
                            return results[idx];
                        }
                    }
                });
                // chrome.webNavigation.getAllFrames({tabId:tabs[0].id},(frames)=>{
                //     alert(JSON.stringify(frames));
                // });
            }
        });
    }

    getFrameByTabIdFrameName(tabId, frameName, callback) {
        if (!tabId || !frameName || !callback) {
            callback(false);
            return false;
        }
        //1.Find the correct target url first
        chrome.tabs.executeScript(tabId, {
            code: "(()=>{if('" + frameName + "'==window.name){return window.location.href;}})()",
            allFrames: true
        }, (results) => {
            for (let idx in results) {
                let realTargetUrl = results[idx];
                if (realTargetUrl) {
                    chrome.webNavigation.getAllFrames({tabId: tabId}, (results2) => {
                        for (let idx2 in results2) {
                            // alert('realTargetUrl:'+realTargetUrl+',frameUrl:'+results2[idx2].url+':'+ (realTargetUrl == results2[idx].url));
                            if (realTargetUrl == results2[idx2].url) {
                                callback(results2[idx2]);
                                // alert('target url:'+realTargetUrl+',frameId:'+results2[idx2].frameId);
                                break;
                            }
                        }
                        callback(false);
                    });
                    break;
                }
            }
            callback(false);
        });
    }

    ajaxGetSync(url, data) {
        // alert('chrome_ext_bg:Sync task request received:'+url);
        let retResult = null;
        this.ajaxUtil.get(url, 'object' == typeof data ? data : {}, (result) => {
            retResult = result;
        }, false);
        return retResult;
    }

    ajaxPostSync(url, data) {
        // alert('chrome_ext_bg:Sync task request received:'+url+',data:'+JSON.stringify(data));
        let retResult = null;
        this.ajaxUtil.post(url, 'object' == typeof data ? data : {}, (result) => {
            retResult = result;
        }, false);
        return retResult;
    }

    httpGet(url, data, callback, async = true) {
        url = (url.includes('http://') || url.includes('https://')) ? url : (this.bgWebSocket.servAddr + url);
        return this.ajaxUtil.get(url, data, callback, async);
    };

    httpPost(url, data, callback, async = true) {
        return this.ajaxUtil.post(url, data, callback, async);
    };

    getCurServUrl() {
        return 'function'===typeof getCurServInfo ? getCurServInfo()[0]:"";
    }

    getBgWebSocketStatus() {
        return this.bgWebSocket ? this.bgWebSocket.getReadyState()[2] : '未初始化';
    }

    createContextMenus(request) {
        if ('undefined' == typeof chrome.contextMenus) {
            return false;
        }
        //Create extension icon right-click menu
        // chrome.contextMenus.removeAll();
        // Remove the old menu first
        //chrome.contextMenus.remove('dwsHomePage');
        //chrome.contextMenus.remove('reOpenClientPages');
        //chrome.contextMenus.remove('bgWsStatus');
        //chrome.contextMenus.remove('switchBgDebug');
        //chrome.contextMenus.remove('enableHttpstoHttp');
        //chrome.contextMenus.remove('disableHttpstoHttp');
        //extension assistance
        chrome.contextMenus.create({
            id: 'flushAllTabs',
            type: 'normal',
            title: chrome.i18n.getMessage("flushAllTabs"),
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.flushAllTabs({alertDebug: false, gapMs: 5000});
            }
        });
        chrome.contextMenus.create({
            id: 'flushOthersTabs',
            type: 'normal',
            title: chrome.i18n.getMessage("flushOtherTabs"),
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                chrome.tabs.query({active: true}, (tabs) => {
                    if (tabs.length < 1) {
                        alert('error,cur tab not found');
                        return;
                    }
                    this.flushAllTabs({alertDebug: false, gapMs: 5000, notTabId: tabs[0].id});
                });
            }
        });
        chrome.contextMenus.create({
            id: 'reOpenClientPages',
            type: 'normal',
            title: chrome.i18n.getMessage("reOpenAllPages"),
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.reOpenAllPages(2000);
            }
        });

        chrome.contextMenus.create({
            id: 'bgWsStatus',
            type: 'normal',
            title: chrome.i18n.getMessage("checkWsStatus"),
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                alert('current server connection status(' + this.getBgWebSocketStatus() + ')');
                if ('已关闭' == this.getBgWebSocketStatus()) {
                    this.getBgWebSocket().reconnect(true);
                }
            }
        });

        //test menu
        chrome.contextMenus.create({
            id: 'switchBgDebug',
            type: 'normal',
            title: chrome.i18n.getMessage("switchBgDebug"),
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.enableBgDebug = !this.enableBgDebug;
                alert('switch successful, the current debug switch(' + this.enableBgDebug + '):'+this.getClientExtId());
            }
        });
        chrome.contextMenus.create({
            id: 'enableHttpstoHttp',
            type: 'normal',
            title: chrome.i18n.getMessage("enableHttpstoHttp"),
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.enableHttpstoHttp = true;
            }
        });

        chrome.contextMenus.create({
            id: 'disableHttpstoHttp',
            type: 'normal',
            title: chrome.i18n.getMessage("disableHttpstoHttp"),
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.enableHttpstoHttp = false;
            }
        });
    }

    flushAllTabs(request) {
        //chrome.tabs.getAllInWindow obsolete
        chrome.tabs.query({}, async (tabs) => {
            for (let i in tabs) {
                if ('undefined' != typeof request && request.notTabId && request.notTabId == tabs[i].id) {
                    // alert('Skip current tab page refresh:'+tabs[i].title);
                    continue;
                }
                'undefined' != typeof request && request.alertDebug ? alert('flush tab:' + tabs[i].url + ',infos:' + JSON.stringify(tabs[i])) : false;
                //flush tab
                chrome.tabs.update(tabs[i].id, {url: tabs[i].url, selected: tabs[i].selected});
                'undefined' != typeof request && request.gapMs ? await new Promise(resolve => setTimeout(resolve, request.gapMs)) : false;
            }
        });
        return true;
    }

    reOpenAllPages(sleepMs) {
        this.getAllTabs(async (tabs) => {
            if (tabs.length < 1) {
                alert('No page is currently found, please refresh manually:');
                return;
            }
            for (let eachTab of tabs) {
                chrome.tabs.remove([eachTab.id], () => {
                });//Support batch shutdown
                sleepMs ? await this.sleepSyncPromise(sleepMs) : false;
                chrome.tabs.create({url: eachTab.url}, () => {
                });
            }
        });
    }

    getServUrlList() {
        return 'undefined' === typeof servUrlList ? {} : servUrlList;
    }

    setJsToPopUp(outJs) {
        this.jsToPopUp = outJs;
    }

    getJsToPopUp() {
        return this.jsToPopUp || '2>1';
    }

    openClientHome() {
        let servUrl = this.getCurServUrl();
        // let servUrl = getCurServInfo()[0];
        if ('0' == servUrl) {
            window.alert('out of service');
            return;
        }
        if (!servUrl) {
            window.alert('the server is not yet open');
            return;
        }
        servUrl += dwsServerHomePath;
        window.open(servUrl);
    }

    setServUrlList(newServUrlList) {
        return servUrlList = newServUrlList;
    }

    getFrontJs(notEncodeURI) {
        //notice: encodeURI must call before return
        let frontJs = super.getFrontJs(true) + DwsChmExtFt.toString() + ';var dwsChmExtFt=new DwsChmExtFt();';//Var-level variables have wider scope and can be called elsewhere
        return encodeURI(frontJs);
    }

    setGlbErrTxt(errTxt) {
        dwsStatusInfo.errInfo = errTxt;
    }

    isSelfServPage(targetUrl) {
        let selfServUrlKeywords=this.upPrjName+'/';
        if (targetUrl && 'string' == typeof targetUrl) {
            return -1 !== targetUrl.indexOf(selfServUrlKeywords) ? true : false;
        }
        return -1 !== window.location.href.indexOf(selfServUrlKeywords) ? true : 0;
    }

    //Rewrite the parent class method to automatically correct the target sender nested in the main page iframe
    onSenderRecieve(sender) {
        if (!sender || !sender.url || !sender.tab) {
            return false;
        }
        if (!this.isSelfServPage(sender.url)) {
            return super.onSenderRecieve(sender);//Non-iframe nesting is handled according to the parent class
        }
        if (this.globalSenders[sender.url] && this.globalSenders[sender.url].tab.id == sender.tab.id && this.globalSenders[sender.url].frameId) {
            if ('loading' != sender.tab.status) {
                //loading means the page is refreshed
                // alert('no change?:'+JSON.stringify(sender));
                return true;//No change, no processing, return directly
            }
            this.globalSenders[sender.url].frameId = 0;//Reset frameId, refresh indicates that the old frameId has expired
        }
        if (!sender.frameId) {
            // alert('iframe nesting detected, sender error!' + JSON.stringify(sender));
            this.getFrameByTabIdFrameName(sender.tab.id, 'myIframe', (frameInfo) => {
                if (frameInfo) {
                    //fix the real frameId
                    sender.frameId = frameInfo.frameId;
                    sender.frameInfo = frameInfo;
                    super.onSenderRecieve(sender);
                    // alert('Detected iframe nesting, sender error, after automatic correction:' + JSON.stringify(sender));
                    this.globalSenders[frameInfo.url] = sender;//Cache another record according to the real url of the iframe (for later front-end and back-end mapping communication)
                } else {
                    // alert('frame with correct address not found!');
                }
            });
        }
    }

    /////////////////////////business related methods////////////////
}
dwsChmExtBg = new DwsChmExtBg();
