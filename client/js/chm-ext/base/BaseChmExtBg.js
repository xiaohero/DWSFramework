/**Chrome extension dynamic js injection tool class (generic background base class)**/
class BaseChmExtBg {
    constructor() {
        // if (this.getFrontJs === BaseChmExtBg.prototype.getFrontJs) {
        //     throw new TypeError("Please implement abstract method getFrontJs.");
        // }
        this.globalSenders = {};
        this.globalVars = {};
        this.curSender = null;
        this.initListenEvent();

        //Control https to http switch
        this.enableHttpstoHttp = false;
        this.latestHttpUrl = '';
        //Extension Id
        this.clientExtId = '';
        this.initClientExtId();
        //Record the tabs currently being monitored
        this.monitoringTabs = {};
    }

    //Obsolete: Note that this function may be inaccurate
    sendJsToCurSender(jsCode) {
        if (!this.curSender || !this.curSender.tab) {
            return false;
        }
        return this.sendJsToPage(this.curSender.tab.id, this.curSender.frameId, jsCode);
    }

    logToCurSender(logMsg, targetTabIdOrUrl = 0) {
        let jsCode = "console.log('bg debug:" + logMsg + "');";
        if (targetTabIdOrUrl && (targetTabIdOrUrl + '').startsWith('http')) {
            return this.sendJsToPageByUrl(targetTabIdOrUrl, jsCode);
        }
        if (targetTabIdOrUrl && !isNaN(targetTabIdOrUrl)) {
            return this.sendJsToPage(targetTabIdOrUrl, 0, jsCode);
        }
        if (!this.curSender || !this.curSender.tab) {
            return false;
        }
        return this.sendJsToPage(this.curSender.tab.id, this.curSender.frameId, jsCode);
    }

    sendJsToPageByUrl(targetUrl, jsCode, byCache=true) {
        let targetSender = (byCache ? this.getSenderByUrl(targetUrl) : null);
        // alert('get from cache：' + targetSender+','+ targetUrl+',allSender:'+JSON.stringify(this.globalSenders));
        if (targetSender && targetSender.tab) {
            return this.sendJsToPage(targetSender.tab.id, targetSender.frameId, jsCode);
        }
        this.getTabByUrl(targetUrl, (tab) => {
            // alert('get from ext：'+ JSON.stringify(tab)+','+ targetUrl);
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

    //Subclasses can override this method
    onSenderRecieve(sender) {
        if (sender && sender.url) {
            if ('object' === typeof this.globalSenders[sender.url]) {
                sender.nwEnable = ('boolean' === typeof this.globalSenders[sender.url].nwEnable && this.globalSenders[sender.url].nwEnable) ? true : false;
            }
            this.globalSenders[sender.url] = sender;
        }
    }

    getActiveTab() {
        return new Promise(resolve => {
            let queryInfo = {active: true};
            chrome.tabs.query(queryInfo, (tabs) => {
                let targetTab = (tabs && tabs.length > 0) ? tabs[0] : null;
                //cache to globalSenders
                this.globalSenders[targetTab.url] = targetTab;
                resolve(targetTab);
            });
        });
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
        //Note: URLs with # cannot be matched
        let queryInfo = (-1 !== tabUrl.indexOf('#') ? {} : {url: tabUrl});
        chrome.tabs.query(queryInfo, (tabs) => {
            // alert('getTabByUrl:targetUrl:' + tabUrl + ',findTabs:' + JSON.stringify(tabs));
            let targetTab = null;
            if (tabs && tabs.length > 0) {//When there are multiple matches, complete the match again according to the url
                for (let idx in tabs) {
                    if (tabUrl == tabs[idx].url) {
                        //fixme:Might want to consider multiple matches
                        targetTab = tabs[idx];
                        break;
                    }
                }
            }
            if (!targetTab) {
                // alert('The specified tab was not found, target url:' + tabUrl + ',query:' + JSON.stringify(queryInfo) + ',curSender:' + JSON.stringify(this.curSender));
                this.getAllTabs((tabs) => {
                    // alert('all_tabs:' + JSON.stringify(tabs));
                });
                callback(false);
                return false;
            }
            //fixme:Here you can update the cache content again
            callback(targetTab);
        });
    }

    initListenEvent() {
        //Listen to bg events
        chrome.runtime.onMessage.addListener((request, sender, callback) => {
            //console.log('chrome_ext_bg get page message:' + JSON.stringify(request) + ' execute function:' + request.funcName + ',typeof:' + typeof this[request.funcName]);
            if ('function' != typeof this[request.funcName]) {
                alert('chrome_ext_bg error:invoke unkown method:' + request.funcName + ',self:' + JSON.stringify(this));
                callback('chrome_ext_bg error:invoke unkown method:' + request.funcName);
                return;
            }
            let exeResult = '';
            this.curSender = sender;
            this.onSenderRecieve(sender);
            if ('jsCode' == request.varName) {
                // alert('chrome_ext_bg execute js dynamically:'+request.varValue+',type:'+typeof request.varValue);
                exeResult = window.eval(request.varValue);
                // alert(request.varValue+',exe results:'+exeResult);
            } else {
                // this[request.funcName].apply(this, request);
                exeResult = this[request.funcName](request);
            }
            // alert('chrome_ext_bg:' + request.funcName + ':result:' + JSON.stringify(exeResult)+',type:'+typeof exeResult);
            //Note that the value json_encode will be returned here, so that the foreground eval parameter is parsed as a js variable
            callback(JSON.stringify(exeResult));
        });
        //Listen to the page close event and clear the globalSenders cache
        chrome.tabs.onRemoved.addListener( (tabId, removeInfo)=>{
            for (let eachUrl in this.globalSenders) {
                tabId in this.monitoringTabs && delete this.monitoringTabs[tabId];
                if(tabId==this.globalSenders[eachUrl].tab.id){
                    delete this.globalSenders[eachUrl];
                    break;
                }
            }
        });
    }

    getGlobalVar(request) {
        // alert('chrome_ext_bg:getGlobalVar:key:'+request.varName+',value:'+this.globalVars[request.varName]);
        return 'undefined' == typeof this.globalVars[request.varName] ? null : this.globalVars[request.varName];
    }

    setGlobalVar(request) {
        // alert('chrome_ext_bg:setGlobalVar:key:'+request.varName+',value:'+request.varValue);
        return this.globalVars[request.varName] = request.varValue;
    }

    nothing(request) {
        //Empty shell function, cannot be deleted
    }

    sleepSyncPromise(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getFrontJs(notEncodeURI=false) {
        // let frontJs = BaseChmExtFt.toString() + ';var baseChmExtFt=new BaseChmExtFt();';//Var-level variables have wider scope and can be called elsewhere
        let frontJs = BaseChmExtFt.toString();
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

    getCurrentExtentionId() {
        return chrome.runtime.id;
    }

    getClientExtId() {
        if (!this.clientExtId) {
            this.initClientExtId();
        }
        return this.clientExtId;
    }

    setRunningStatus(runStatus) {
        dwsClientStatusInfo['errTxt'] = runStatus;
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
        //Reference documentation: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/onBeforeRequest
        chrome.webRequest.onBeforeRequest.addListener((details) => {
                //details.type:websocket,main_frame,xmlhttprequest,other
                //details.tabId
                //alert('Debug:' + JSON.stringify(details));
                //The return value can only be:{cancel:xx} or {redirectUrlOptional:xx}
                if (this.enableHttpstoHttp) {
                    if (('object' === typeof details) && ('undefined' !== typeof details.type && 'undefined' !== typeof details.url)) {
                        let newUrl = details.url;
                        if (-1 !== newUrl.indexOf('https://') && -1 === newUrl.indexOf('.js') && -1 === newUrl.indexOf('.xml')) {
                            newUrl = newUrl.replace('https://', 'http://');
                        } else if (-1 !== newUrl.indexOf('wss://')) {
                            newUrl = newUrl.replace('wss://', 'ws://');
                        }
                        if (newUrl !== details.url) {
                            //alert('old url:' + details.url + ',new url:' + newUrl+',last url:'+this.latestHttpUrl);
                            //Determine whether the url of this jump is the same as the last time to prevent circular redirection
                            if (newUrl === this.latestHttpUrl) {
                                //alert('Circular redirect detected, terminate operation!');
                                return;
                            }
                            // details.url=newUrl;
                            //save last http url
                            this.latestHttpUrl = newUrl;
                            return {redirectUrl: newUrl};
                        }
                    }
                }
            },
            {urls: ['<all_urls>'], types: ['main_frame', 'xmlhttprequest', 'websocket']},
            ['blocking']
            //blocking:Indicates synchronous blocking so that the request can be controlled to cancel or redirect
            //['blocking','requestBody']
        );
    }

    async enableNetworkMonitorByUrl(dstUrl, requestMatchReg = '', responseMatchReg = '', cbFunc, autoDetach = true, returnUrlEncode = true, requestMatchTypes = []) {
        requestMatchReg = ('string' === typeof requestMatchReg && requestMatchReg) ? new RegExp(requestMatchReg) : '';
        responseMatchReg = ('string' === typeof responseMatchReg && responseMatchReg) ? new RegExp(responseMatchReg) : '';
        requestMatchTypes = ('string' === typeof requestMatchTypes && requestMatchTypes) ? requestMatchTypes.trim().replaceAll(' ', '') : '';
        requestMatchTypes = requestMatchTypes ? requestMatchTypes.split(',') : [];
        let activeTab=null;
        if (!dstUrl) {
            //If no dstUrl is passed, the currently active tab page is monitored
            activeTab = await this.getActiveTab();
            dstUrl= activeTab.url;
        }
        if (!dstUrl || !requestMatchReg || !responseMatchReg) {
            return false;
        }
        //let curSender = activeTab ? activeTab : this.getSenderByUrl(dstUrl);
        let curSender=this.getSenderByUrl(dstUrl);
        if(curSender&&curSender.nwEnable){
            this.logToCurSender('The current tab page has activated network monitoring, skip:' + JSON.stringify(curSender), curSender.tab.id);
            return true;
        }
        //Record the traffic'requestId that needs to be captured
        let targetRequestIds = {};
        //alert('requestMatchReg:' + requestMatchReg + ',responseMatchReg:' + responseMatchReg + ',requestMatchTypes:' + requestMatchTypes + ',target url:' + dstUrl);
        this.getTabByUrl(dstUrl, (findTab) => {
            if (!findTab) {
                alert('Failed to monitor network, tab not found:' + dstUrl);
                //console.log('Failed to monitor network, tab not found:' + dstUrl);
                return;
            }
            //alert('find tab:' + JSON.stringify(findTab));
            let attachVersion = '1.0';
            //Activate debug current tab
            chrome.debugger.attach({
                    tabId: findTab.id
                }, attachVersion,
                ((tmpTabId, tmpUrl) => {
                    return () => {
                        // this.disableNetworkMonitorByUrl(tmpUrl);
                        //Enable network monitoring
                        chrome.debugger.sendCommand({
                            tabId: tmpTabId
                        }, 'Network.enable', (result) => {
                            curSender ? this.globalSenders[dstUrl].nwEnable = this.monitoringTabs[tmpTabId] = curSender : false;
                            //monitor network traffic
                            chrome.debugger.onEvent.addListener((source, method, params) => {
                                //method:Network.requestWillBeSent,Network.dataReceived,Network.loadingFinished,Network.responseReceived
                                //params.type:Script,XHR,Image
                                if (source.tabId !== tmpTabId) {
                                    return;
                                }
                                //Filter the requestId that identifies the traffic that needs to be captured
                                if ('Network.requestWillBeSent' == method && 'type' in params && 'request' in params && 'url' in params.request && params.request.url) {
                                    //console.log("debug:requestWillBeSent:tabId:" + tmpTabId + "params:" + JSON.stringify(params));
                                    let isUrlMatch=params.request.url.match(requestMatchReg);
                                    let isTypeMatch = requestMatchTypes.length < 1 || requestMatchTypes.includes(params.type);
                                    (isUrlMatch && isTypeMatch) ? targetRequestIds[params.requestId] = {url:params.request.url,type:params.type} : false;
                                    //isUrlMatch && this.logToCurSender('requestWillBeSent:'+params.request.url+',isMatch:'+isUrlMatch[0]+',requestId:'+params.requestId+',responseMatchReg:'+requestMatchReg,tmpTabId);
                                }
                                //Obtain the data after the network is loaded, otherwise the captured data may be incomplete (lost part)
                                if ('Network.loadingFinished' == method && params.requestId in targetRequestIds) {
                                    //Hit target url
                                    let hitUrl=targetRequestIds[params.requestId].url;
                                    //Hit target type
                                    let hitType=targetRequestIds[params.requestId].type;
                                    //this.logToCurSender('loadingFinished:'+JSON.stringify(params)+',requestId:'+params.requestId,tmpTabId);
                                    chrome.debugger.sendCommand({
                                        tabId: tmpTabId
                                    }, 'Network.getResponseBody', {
                                        'requestId': params.requestId
                                    }, (response) => {
                                        if ('object' !== typeof response) {
                                            return;
                                        }
                                        if (responseMatchReg && response.body) {
                                            //this.logToCurSender('getResponseBody:'+response.body+',requestId:'+params.requestId,tmpTabId);
                                            let findRet = ('/true/' === '' + responseMatchReg) ? [response.body] : response.body.match(responseMatchReg);
                                            // alert('dstUrl:' + dstUrl + ',hit:' + responseMatchReg + ',findRet:' + JSON.stringify(findRet) + ',response_body:' + response.body);
                                            if (findRet) {
                                                findRet = returnUrlEncode ? encodeURI(findRet[0]) : findRet[0];
                                                'function' === typeof cbFunc ? cbFunc(hitUrl, findRet, hitType, tmpTabId) : alert(findRet);
                                                //console.log('tabId:' + tmpTabId + ',dstUrl:' + dstUrl + ',hitUrl:' + hitUrl + ',hitType:' + hitType + ',findRet:' + findRet.length);
                                                //In case the url changes, unbind by tabid
                                                if (autoDetach) {
                                                    this.disableNetworkMonitorByTabId(tmpTabId);
                                                    curSender ? this.globalSenders[dstUrl].nwEnable = false : false;
                                                }
                                            }
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
        return this.getTabByUrl(url, (findTab) => {
            if (!findTab) {
                alert('detach failed, tab not found:' + url);
                return false;
            }
            return this.disableNetworkMonitorByTabId(findTab.id, cbFunc);
        });
    }

    disableNetworkMonitorByTabId(tabId, cbFunc = () => {
    }) {
        //this.monitoringTabs[tabId] = false;
        tabId in this.monitoringTabs && delete this.monitoringTabs[tabId];
        return chrome.debugger.detach({
            tabId: parseInt(tabId)
        }, () => {
            cbFunc(true);
            //alert('Close debugging successfully!');
        });
    }

    disableCurrentNetworkMonitor(cbFunc = () => {
    }) {
        let targetTabId = (1 == Object.keys(this.monitoringTabs).length) ? Object.keys(this.monitoringTabs)[0] : 0;
        if (!targetTabId) {
            console.log("The currently active tab page was not found and cannot be detach");
            return false;
        }
        //alert("disableCurrentNetworkMonitor:" + targetTabId + "=>" + this.monitoringTabs[targetTabId].url);
        return this.disableNetworkMonitorByTabId(targetTabId, cbFunc);
    }
}