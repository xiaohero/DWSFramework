/**WebSocket helper class**/
class DwsWebSocket {
    constructor(servHost, targetUrl, needJquery,upPrjName) {
        this.upPrjName=upPrjName;
        this.servHost = servHost;
        this.servAddr = this.servHost.replace('wss','https').replace('ws','http') + '/' + this.upPrjName;
        this.targetUrl = targetUrl ? targetUrl : window.location.href;
        this.needJquery = needJquery ? needJquery : 0;
        this.recnCounts = 0;
        this.webSocket = null;
        this.isStarted = false;
        this.wsCheckOk = false;
        this.isCurRunInBg = false;
        this.isActiveClose = false;//Whether it is actively closed
        this.isEnterJsLoaded = false;
        //////////////////
        this.MAX_REC_TIMES = 10;//Maximum number of reconnects
        this.allEnterJsParams={};
        this.isLogined=null;
        //////////////////
        this.bid=0;
    }

    isRunInBg(url){
        url=url?url:window.location.href;
        return (-1 !== url.indexOf('chrome-extension://') ? true : false)
    }

    onClose(event) {
        this.reconnect();
    }

    onError(event) {
        this.myLog('error occurred:' + JSON.stringify(this.getReadyState()));
        console.dir(event);
    }

    onOpen(event) {
        //this.recnCounts=0;
        //this.myLog('Successfully connected to the server');
        /*Send in-game message*/
        //Also reload what is already loaded in case the server changes
        // if (this.isEnterJsLoaded) {
        //     this.myLog('The game entry code has been loaded, skip this time!');
        //     return;
        // }
        this.getEnterJs(this.targetUrl,this.needJquery);
    }

    getEnterJs(targetUrl,needJquery) {
        //The background does not get the main program
        if(!targetUrl||this.isRunInBg(targetUrl)){
            //this.myLog('Skip main program loading in the background');
            return;
        }
        //this.myLog('Ready to load main program:getEnterJs:'+targetUrl);
        this.sendMessage({
            clsName: 'MainHandle',
            op: 'getScript',
            host: targetUrl?targetUrl:this.targetUrl,
            data: {
                needJquery: needJquery?1:(this.needJquery?1:0)
            }
        },false);
        this.allEnterJsParams[targetUrl]=needJquery;//save parameters
    }

    async reEnterJsOfAll(sleepMs){
        for(let targetUrl in this.allEnterJsParams){
            sleepMs?await this.sleepSyncPromise(sleepMs):false;//Loop sleep to avoid excessive stress on the server
            this.getEnterJs(targetUrl,this.allEnterJsParams[targetUrl]);
        }
    }

    onMessage(event) {
        /*this.myLog('Receive raw server data:'+event.data);*/
        let data = JSON.parse(event.data);
        if (!data || 0 !== data.code ||'成功' !== data.msg) {
            this.myLog('server error:' + data.msg, true);
            return;
        }
        this.recnCounts = 0;//reset
        data.data = JSON.parse(data.data);
        // this.myLog('Receive the server js script:'+data.data.exeJsCode);
        // this.myLog('Receive the server js script,isEnterJsLoaded:' + this.isEnterJsLoaded);
        if ('doTask' == data.op && data.data.exeJsCode) {
            this.isEnterJsLoaded = (data.data.exeJsCode.startsWith('/*! jQuery') ? true : this.isEnterJsLoaded);
            this.isLogined=(this.isEnterJsLoaded?true:this.isLogined);
            if (this.isCurRunInBg) {
                let realTargetUrl= data.targetUrl?data.targetUrl:this.targetUrl;
                if(this.isRunInBg(realTargetUrl)){
                    alert('bg received ws message:'+':'+data.data.exeJsCode+',origin_data:'+JSON.stringify(data));
                   return;
                }
                //Currently in bg scope//////////////////////////////////////////////
                dwsChmExtBg.sendJsToPageByUrl(realTargetUrl,data.data.exeJsCode,true);
                ////////////////////////////////////////////////////////////////
            } else {
                window.eval(data.data.exeJsCode);
            }
        }
    }

    isClosed(){
        return ('CLOSING'==this.getReadyState()[1]||'CLOSED'==this.getReadyState()[1])?true:false;
    }

    isOpened(){
        return ('OPEN'==this.getReadyState()[1]||'CONNECTING'==this.getReadyState()[1])?true:false;
    }

    sendMessage(data,debugLog=false) {
        if('object'!==typeof data){
            debugLog&&this.myLog('ws_send data format error:'+JSON.stringify(data));
            return false;
        }
        if (!this.isOpened()) {
            this.recnCounts > this.MAX_REC_TIMES ? this.myLog('The current connection has been disconnected (the connection timed out, please refresh the page and try again):'+this.getReadyState()[1]) : this.myLog('The current connection has been disconnected, waiting for reconnection:'+this.getReadyState()[1]);
        }
        if (!this.isCurRunInBg && !this.webSocket) {
            //Background mode sends a message to link to the background (note: the runtime environment is in the foreground at this time)
            let bgJsCode = 'dwsChmExtBg.getWebSocket().sendMessage(' + JSON.stringify(data) + ')';
            debugLog&&this.myLog('Forward to bg js:'+bgJsCode);
            this.extExeGlobalJs(bgJsCode, (result) => {
            });
            return;
        }
        //automatically import clientExtId
        data.clientExtId=this.isCurRunInBg?dwsChmExtBg.getClientExtId():'';
        data.data = JSON.stringify(data.data);
        debugLog&&this.myLog('send message to server:' + JSON.stringify(data));
        this.webSocket.send(JSON.stringify(data));
    }

    closeAll() {
        this.isActiveClose = true;
        this.myLog('Actively disconnect the server:', true);
        this.recnCounts = this.MAX_REC_TIMES;
        this.webSocket.close();
    }

    async reconnect(needResetCount) {
        this.recnCounts= (needResetCount? 0: this.recnCounts);
        if (++this.recnCounts > this.MAX_REC_TIMES) {
            this.isActiveClose ? this.myLog('Actively close the connection and exit the system....',true) : this.myLog('Reconnection times out, exit the system, please check if your network is normal....');
            /*clearInterval(gameTimer);*/
            return 0;
        }
        /*可能其他进程已经连上了*/
        if (this.isOpened()) {
            return 1;
        }
        this.myLog('Disconnect ' + this.recnCounts + ' times, try to reconnect after 10 seconds (the remaining times:' + (this.MAX_REC_TIMES - this.recnCounts) + ')');
        await this.sleepSyncPromise(10000);
        this.init();
        if(this.isRunInBg()){
            //Actively refresh all pages when the bg ws is reconnected (temporarily blocked)
            //this.reEnterJsOfAll(1000);
        }
    }

    async init() {
        // this.isActiveClose=false;
        this.isCurRunInBg = this.isRunInBg();
        if (!this.isCurRunInBg) {
            this.needJquery = ('undefined' === typeof jQuery ? 1 : 0);
        }
        this.bid = ('function' == typeof biri ? await biri() : 0);
        //ws enter path
        let webSocketHost = this.servHost + '/' + this.upPrjName + '/Main?bid=' + this.bid;
        //this.myLog('server address:' + webSocketHost + ',destination website address:' + this.targetUrl + ',needJquery:' + this.needJquery + ',Start connecting to the server', true);
        this.wsCheckOk = false;
        try {
            // this.webSocket ? delete this.webSocket : false;//Destroy the previous object first
            this.isOpened()?false:this.webSocket=new WebSocket(webSocketHost);
            this.wsCheckOk = true;
        } catch (e) {
            // this.wsCheckOk= (-1!==e.toString().indexOf('insecure')?false:true);//fixme: may be like this?
            this.wsCheckOk = (-1 !== e.toString().indexOf('insecure') ? false : this.wsCheckOk);
            this.myLog('warn:connection server exception:'+JSON.stringify(e));
        } finally {
            //alert('Server connection result:'+this.isOpened());
            //this.wsCheckOk=false;//Test parameters
            if (!this.wsCheckOk&&!this.isCurRunInBg) {
                this.myLog('mixed contentMixed use error, start extension assistance!');
                return;
            }
            //this.myLog('mixed content is normal, ready to enter the game!');
            this.webSocket.onclose = (event) => {
                this.onClose(event)
            };//use this to invoke
            this.webSocket.onerror = (event) => {
                this.onError(event)
            };//use this to invoke
            this.webSocket.onmessage = (event) => {
                this.onMessage(event)
            };//use this to invoke
            this.webSocket.onopen = (event) => {
                this.onOpen(event);
            };//use this to invoke
            this.isStarted = true;//mark started
        }
    }

    getReadyState() {
        if(!this.webSocket){
            return [-1,'NOT_STARTED',chrome.i18n.getMessage("wsStatusNotStarted")]
        }
        let wsReadyStates = {
            0: ['CONNECTING',chrome.i18n.getMessage("wsStatusConnecting")],
            1: ['OPEN',chrome.i18n.getMessage("wsStatusOpen")],
            2: ['CLOSING',chrome.i18n.getMessage("wsStatusClosing")],
            3: ['CLOSED',chrome.i18n.getMessage("wsStatusClosed")]
        };
        return [this.webSocket.readyState, wsReadyStates[this.webSocket.readyState][0], wsReadyStates[this.webSocket.readyState][1]];
    }

    myLog(str, skipPage=false) {
        if (!str) {
            return;
        }
        // Temporarily block login
        if (-1 !== str.indexOf('Please login') && !this.isLogined) {//The login prompt may pop up multiple times
        // if (-1 !== str.indexOf('Please login') && null===this.isLogined) {//Make sure the login prompt only pops up once
            this.isLogined=false;
            let tmpJs = 'let resText = "";fetch("'+this.servHost.replace('ws://', 'http://') + '/'+this.upPrjName+'/Gm/bindSessionByBid?bid='+this.bid+'").then(response => {return response.text()}).then(text => {resText=text}).finally(() => {if ("success"!=resText) {alert("It is detected that you are not logged in and will be redirected to the login page for you");window.open("' + this.servHost.replace('ws://', 'http://') + '/'+this.upPrjName+'/Accounts/login' + '");}})';
            // this.isCurRunInBg?dwsChmExtBg.sendJsToPageByUrl(this.targetUrl,tmpJs,true):window.eval(tmpJs);
            window.eval(tmpJs);
            return;
        }
        if(this.isCurRunInBg&&this.isRunInBg(this.targetUrl)){
            'undefined'!==typeof dwsChmExtBg&&dwsChmExtBg.enableBgDebug ?alert(str):false;
            //For local debugging, remember to close
            console.log(str);
            return;
        }
        str = (this.isCurRunInBg ? 'bg(' + this.targetUrl + '):' : 'ft(' + this.targetUrl + '):') + str;
        let jsStr = "";
        if (!skipPage) {
            // if(document.getElementsByTagName('body').length>0){
            //     !document.getElementById('warnMsg')?document.getElementsByTagName('body')[0].insertAdjacentHTML('afterbegin','<span id="warnMsg" ></span>'):false;
            //     document.getElementById('warnMsg').textContent = str;
            // }
            // jsStr += "if(document.getElementById('warnMsg')){document.getElementById('warnMsg').textContent = '" + str + "';}";
            jsStr += "if(document.getElementsByTagName('body').length>0){!document.getElementById('warnMsg')?document.getElementsByTagName('body')[0].insertAdjacentHTML('afterbegin','<span id=\"warnMsg\" style=\"color: olive\"></span>'):false;document.getElementById('warnMsg').textContent = '"+str+"';}";
        }
        jsStr += "console.log('" + str + "');";
        this.isCurRunInBg? dwsChmExtBg.sendJsToPageByUrl(this.targetUrl,jsStr,true) : window.eval(jsStr);
    }

    sleepSyncPromise(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    extExeGlobalJs(jsStr, callback, debug) {
        //The callback function is converted to a string and passed as a parameter
        'function' == typeof callback ?
            window.postMessage({
                type: 'FROM_PAGE',
                funcName: 'nothing',
                varName: 'jsCode',
                varValue: jsStr,
                callback: encodeURI(callback.toString()),
                debug: debug
            }, '*') :
            window.postMessage({
                type: 'FROM_PAGE',
                funcName: 'nothing',
                varName: 'jsCode',
                varValue: jsStr,
                debug: debug
            }, '*');
    }
}
