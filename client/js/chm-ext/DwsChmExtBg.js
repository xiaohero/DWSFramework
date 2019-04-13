/**DWS chrome通用插件: 后台**/
class DwsChmExtBg extends BaseChmExtBg {
    constructor() {
        super();
        this.webSocket = {};
        this.bgWebSocket = null;

        //其它业务参数
        this.enableBgDebug = false;
        this.bgTimerCount = 0;
        //初始化
        this.init();
    }

    init() {
        this.removeIframeDisable();
        this.redirectHttpsToHttp();
        this.createContextMenus();
        this.startBgWebSocket();
        this.bgStartTimer();
    }

    startBgWebSocket() {
        let curServUrl = this.getCurServUrl();
        if (!curServUrl || '0' == curServUrl || 'string' != typeof curServUrl) {
            return;
        }
        //fixme:考虑上次的链接是否需要手工断开?
        curServUrl = curServUrl.replace('http:', 'ws:');
        this.bgWebSocket = new DwsWebSocket(curServUrl, '', 0);
        this.bgWebSocket.init();
    }

    getBgWebSocket() {
        return this.bgWebSocket;
    }


    setExtErrMsg(request) {
        return dwsStatusInfo['errTxt'] = request['varValue'];
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
                // alert('找到目标tab刷新:'+JSON.stringify(this.globalSenders[url]));
                chrome.tabs.update(this.globalSenders[url].tab.id, {
                    url: this.globalSenders[url].tab.url,
                    selected: this.globalSenders[url].tab.selected
                });
            }
            break;
        }
    }


    async startWebSocket(targetUrl, wsServHost, needJquery, toInjtIframeName) {
        // alert('后台收到消息:'+targetUrl+','+wsServHost);
        //判断如果是带有服务器url地址的，取其子frame
        if ('undefined' != typeof this.webSocket[targetUrl]) {
            if (this.webSocket[targetUrl].isOpened()) {
                return;
            }
            // this.webSocket[targetUrl].closeAll();
            // delete this.webSocket[targetUrl];//释放内存
        }
        if (!toInjtIframeName) {
            this.webSocket[targetUrl] = new DwsWebSocket(wsServHost, targetUrl, needJquery);
            this.webSocket[targetUrl].init();
            return;
        }
        // alert('主页面iframe特殊处理,睡眠n秒..');
        await this.sleepSyncPromise(1000);//fixme:时间可能还需要加长
        let targetSender = this.getSenderByUrl(targetUrl);
        (!targetSender || !targetSender.frameId) ? await this.sleepSyncPromise(5000) : false;//再睡眠5秒
        targetSender = this.getSenderByUrl(targetUrl);
        if (targetSender && targetSender.frameId) {
            // alert('检测到目标:' + ':frameId:' + targetSender.frameId + ',url:' + targetUrl + ',真实url;' + targetSender.frameInfo.url);
            //方案1:跟mix content一样，通过后台代理所有ws通信(注意:需要考虑全局webSocket对象也要重新注入到iframe种，否则会报错找不到)
            this.webSocket[targetUrl] = new DwsWebSocket(wsServHost, targetSender.frameInfo.url, needJquery);
            this.webSocket[targetUrl].init();
            this.webSocket[targetSender.frameInfo.url] = this.webSocket[targetUrl];//复制一份副本，映射真实url
            //方案2:直接到真实目标frame执行ws通信
        } else {
            //再睡眠5秒
            // console.log('页面未找到真实frame地址,请刷新重试');
            this.sendJsToPageByUrl(targetUrl, "console.log('页面未找到真实frame地址,自动为你刷新重试');window.location.reload();", true);
        }
    }

    getWebSocket(targetUrl) {
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
                            // alert('正确返回值:' + results[idx]);
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
        //1.先找到正确的目标url
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
                                // alert('目标url:'+realTargetUrl+',frameId:'+results2[idx2].frameId);
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
        // alert('chrome_ext_bg:收到同步任务请求:'+url);
        let retResult = null;
        ajaxUtil.get(url, 'object' == typeof data ? data : {}, (result) => {
            retResult = result;
        }, false);
        return retResult;
    }

    ajaxPostSync(url, data) {
        // alert('chrome_ext_bg:收到同步任务请求:'+url+',data:'+JSON.stringify(data));
        let retResult = null;
        ajaxUtil.post(url, 'object' == typeof data ? data : {}, (result) => {
            retResult = result;
        }, false);
        return retResult;
    }

    getCurServUrl() {
        return getCurServInfo()[0];
    }

    getBgWebSocketStatus() {
        return this.bgWebSocket ? this.bgWebSocket.getReadyState()[2] : '未初始化';
    }


    createContextMenus(request) {
        //创建插件图标右键菜单
        // chrome.contextMenus.removeAll();

        chrome.contextMenus.create({
            id: 'dwsHomePage',
            type: 'normal',
            title: '进入插件官网',
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                let curServUrl = this.getCurServUrl();
                if (!curServUrl || '0' == curServUrl || 'string' != typeof curServUrl) {
                    return;
                }
                window.open(curServUrl + '/DJXNB/BCD/a140c0c1eda2def2b830363ba362aa4d7d255c262960544821f556e16661b6ff');
            }
        });
        //插件辅助
        chrome.contextMenus.create({
            id: 'reOpenClientPages',
            type: 'normal',
            title: '重开所有页面',
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.reOpenAllPages(2000);
            }
        });

        chrome.contextMenus.create({
            id: 'bgWsStatus',
            type: 'normal',
            title: '检测服务器状态',
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                alert('当前服务器连接状态(' + this.getBgWebSocketStatus() + ')');
                if ('已关闭' == this.getBgWebSocketStatus()) {
                    this.getBgWebSocket().reconnect(true);
                }
            }
        });

        //测试菜单
        chrome.contextMenus.create({
            id: 'switchBgDebug',
            type: 'normal',
            title: '切换插件调试模式',
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.enableBgDebug = !this.enableBgDebug;
                alert('切换成功,当前调试开关(' + this.enableBgDebug + ')');
            }
        });

        //https屏蔽工具(开启)
        chrome.contextMenus.create({
            id: 'enableHttpstoHttp',
            type: 'normal',
            title: '开启https转http',
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.enableHttpstoHttp = true;
            }
        });

        //https屏蔽工具(关闭)
        chrome.contextMenus.create({
            id: 'disableHttpstoHttp',
            type: 'normal',
            title: '关闭https转http',
            contexts: ['browser_action', 'page', 'frame'],
            onclick: () => {
                this.enableHttpstoHttp = false;
            }
        });
    }


    flushAllTabs(request) {
        return glbFlushAllTabs(request);
    }

    reOpenAllPages(sleepMs) {
        this.getAllTabs(async (tabs) => {
            if (tabs.length < 1) {
                alert('当前没有发现页面,请手工刷新:');
                return;
            }
            for (let eachTab of tabs) {
                chrome.tabs.remove([eachTab.id], () => {
                });//支持批量关闭
                sleepMs ? await this.sleepSyncPromise(sleepMs) : false;
                chrome.tabs.create({url: eachTab.url}, () => {
                });
            }
        });
    }

    getServUrlList() {
        return servUrlList;
    }

    getFrontJs() {
        //notice: encodeURI must call before return
        let frontJs = BaseChmExtFt.toString() + BtChmExtFt.toString() +
            ';var dwsChmExtFt=new BtChmExtFt();';//var级别变量作用域更广，其它地方可以调用
        return encodeURI(frontJs);
    }

    setGlbErrTxt(errTxt) {
        dwsStatusInfo.errInfo = errTxt;
    }

    isSelfServPage(targetUrl) {
        if (targetUrl && 'string' == typeof targetUrl) {
            return -1 !== targetUrl.indexOf('DJXNB/Gj') ? true : false;
        }
        return -1 !== window.location.href.indexOf('DJXNB/Gj') ? true : 0;
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
            this.getFrameByTabIdFrameName(sender.tab.id, 'myIframe', (frameInfo) => {
                if (frameInfo) {
                    //修正真正的frameId
                    sender.frameId = frameInfo.frameId;
                    sender.frameInfo = frameInfo;
                    this.globalSenders[sender.url] = sender;
                    // alert('检测到iframe嵌套，sender错误,自动修正后:' + JSON.stringify(sender));
                    this.globalSenders[frameInfo.url] = sender;//根据iframe真实url再缓存一份记录(以便后期前后台映射通信)
                } else {
                    // alert('未找到正确地址的frame!');
                }
            });
        }
    }


    /////////////////////////业务相关方法////////////////
}
dwsChmExtBg = new BtChmExtBg();