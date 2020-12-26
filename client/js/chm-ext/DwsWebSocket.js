/**WebSocket辅助类**/
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
        this.isActiveClose = false;//是否主动关闭
        this.isEnterJsLoaded = false;
        //////////////////
        this.MAX_REC_TIMES = 10;//最大重连次数
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
        this.myLog('发生错误:' + JSON.stringify(this.getReadyState()));
        console.dir(event);
    }

    onOpen(event) {
        //this.recnCounts=0;
        //this.myLog('连接服务器成功');
        /*发送进入游戏消息*/
        //已加载的也要重新加载，以防服务器有改动
        // if (this.isEnterJsLoaded) {
        //     this.myLog('game入口代码已加载，此次跳过!');
        //     return;
        // }
        this.getEnterJs(this.targetUrl,this.needJquery);
    }

    getEnterJs(targetUrl,needJquery) {
        //后台不获取主程序
        if(!targetUrl||this.isRunInBg(targetUrl)){
            //this.myLog('后台跳过主程序载入');
            return;
        }
        //this.myLog('准备载入主程序:getEnterJs:'+targetUrl);
        this.sendMessage({
            clsName: 'MainHandle',
            op: 'getScript',
            host: targetUrl?targetUrl:this.targetUrl,
            data: {
                needJquery: needJquery?1:(this.needJquery?1:0)
            }
        },false);
        this.allEnterJsParams[targetUrl]=needJquery;//保存参数
    }

    async reEnterJsOfAll(sleepMs){
        for(let targetUrl in this.allEnterJsParams){
            sleepMs?await this.sleepSyncPromise(sleepMs):false;//循环睡眠,以免对服务器造成过大压力
            this.getEnterJs(targetUrl,this.allEnterJsParams[targetUrl]);
        }
    }

    onMessage(event) {
        /*this.myLog('收到服务器原始数据:'+event.data);*/
        let data = JSON.parse(event.data);
        if (!data || 0 !== data.code ||'成功' !== data.msg) {
            this.myLog('服务器发生错误:' + data.msg, true);
            return;
        }
        this.recnCounts = 0;//重置
        data.data = JSON.parse(data.data);
        // this.myLog('收到服务器js执行脚本:'+data.data.exeJsCode);
        // this.myLog('收到服务器js执行脚本,isEnterJsLoaded:' + this.isEnterJsLoaded);
        if ('doTask' == data.op && data.data.exeJsCode) {
            this.isEnterJsLoaded = (data.data.exeJsCode.startsWith('/*! jQuery') ? true : this.isEnterJsLoaded);
            this.isLogined=(this.isEnterJsLoaded?true:this.isLogined);
            if (this.isCurRunInBg) {
                let realTargetUrl= data.targetUrl?data.targetUrl:this.targetUrl;
                if(this.isRunInBg(realTargetUrl)){
                    alert('后台收到ws消息:'+':'+data.data.exeJsCode+',origin_data:'+JSON.stringify(data));
                   return;
                }
                //当前处于bg作用域//////////////////////////////////////////////
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
            debugLog&&this.myLog('ws_send数据格式错误:'+JSON.stringify(data));
            return false;
        }
        if (!this.isOpened()) {
            this.recnCounts > this.MAX_REC_TIMES ? this.myLog('当前连接已断开(连接超时,请刷新页面重试):'+this.getReadyState()[1]) : this.myLog('当前连接已断开,等待重连:'+this.getReadyState()[1]);
        }
        if (!this.isCurRunInBg && !this.webSocket) {
            //后台模式发送消息链接到后台(注意:此时运行环境处于前台)
            let bgJsCode = 'dwsChmExtBg.getWebSocket().sendMessage(' + JSON.stringify(data) + ')';
            debugLog&&this.myLog('转发到后台js:'+bgJsCode);
            this.extExeGlobalJs(bgJsCode, (result) => {
            });
            return;
        }
        //自动引入clientExtId
        data.clientExtId=this.isCurRunInBg?dwsChmExtBg.getClientExtId():'';
        data.data = JSON.stringify(data.data);
        debugLog&&this.myLog('发送消息给服务器:' + JSON.stringify(data));
        this.webSocket.send(JSON.stringify(data));
    }

    closeAll() {
        this.isActiveClose = true;
        this.myLog('主动断开服务器连接:', true);
        this.recnCounts = this.MAX_REC_TIMES;
        this.webSocket.close();
    }

    async reconnect(needResetCount) {
        this.recnCounts= (needResetCount? 0: this.recnCounts);
        if (++this.recnCounts > this.MAX_REC_TIMES) {
            this.isActiveClose ? this.myLog('主动关闭连接，退出系统....',true) : this.myLog('重连超时，退出系统，请检测你的网络是否正常....');
            /*clearInterval(gameTimer);*/
            return 0;
        }
        /*可能其他进程已经连上了*/
        if (this.isOpened()) {
            return 1;
        }
        this.myLog('连接断开' + this.recnCounts + '次,10秒后尝试重连(剩余次数:' + (this.MAX_REC_TIMES - this.recnCounts) + ')');
        await this.sleepSyncPromise(10000);
        this.init();
        if(this.isRunInBg()){
            //后端ws重连时主动刷新所有页面(临时屏蔽)
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
        //this.myLog('服务器地址:' + webSocketHost + ',目标网站地址:' + this.targetUrl + ',needJquery:' + this.needJquery + ',开始连接服务器', true);
        this.wsCheckOk = false;
        try {
            // this.webSocket ? delete this.webSocket : false;//先销毁先前对象
            this.isOpened()?false:this.webSocket=new WebSocket(webSocketHost);
            this.wsCheckOk = true;
        } catch (e) {
            // this.wsCheckOk= (-1!==e.toString().indexOf('insecure')?false:true);//fixme: may be like this?
            this.wsCheckOk = (-1 !== e.toString().indexOf('insecure') ? false : this.wsCheckOk);
            this.myLog('warn:连接服务器异常:'+JSON.stringify(e));
        } finally {
            //alert('服务器连接结果:'+this.isOpened());
            //this.wsCheckOk=false;//测试参数
            if (!this.wsCheckOk&&!this.isCurRunInBg) {
                this.myLog('mixed content混用错误,启动插件辅助!');
                return;
            }
            //this.myLog('mixed content检测正常,准备进入游戏!');
            this.webSocket.onclose = (event) => {
                this.onClose(event)
            };//用this去调
            this.webSocket.onerror = (event) => {
                this.onError(event)
            };//用this去调
            this.webSocket.onmessage = (event) => {
                this.onMessage(event)
            };//用this去调
            this.webSocket.onopen = (event) => {
                this.onOpen(event);
            };//用this去调
            this.isStarted = true;//标示已启动
        }
    }

    getReadyState() {
        if(!this.webSocket){
            return [-1,'NOT_STARTED','未连接']
        }
        let wsReadyStates = {
            0: ['CONNECTING','连接中'],
            1: ['OPEN','已连接'],
            2: ['CLOSING','正在关闭'],
            3: ['CLOSED','已关闭']
        };
        return [this.webSocket.readyState, wsReadyStates[this.webSocket.readyState][0], wsReadyStates[this.webSocket.readyState][1]];
    }

    myLog(str, skipPage=false) {
        if (!str) {
            return;
        }
        // 临时屏蔽登录
        if (-1 !== str.indexOf('请先登录') && !this.isLogined) {//可能多次弹出登录提示
        // if (-1 !== str.indexOf('请先登录') && null===this.isLogined) {//确保只弹出一次登录提示
            this.isLogined=false;
            let tmpJs = 'let resText = "";fetch("'+this.servHost.replace('ws://', 'http://') + '/'+this.upPrjName+'/Gm/bindSessionByBid?bid='+this.bid+'").then(response => {return response.text()}).then(text => {resText=text}).finally(() => {if ("success"!=resText) {alert("检测到你尚未登录，即将为你自动跳转登录页面");window.open("' + this.servHost.replace('ws://', 'http://') + '/'+this.upPrjName+'/Accounts/login' + '");}})';
            // this.isCurRunInBg?dwsChmExtBg.sendJsToPageByUrl(this.targetUrl,tmpJs,true):window.eval(tmpJs);
            window.eval(tmpJs);
            return;
        }
        if(this.isCurRunInBg&&this.isRunInBg(this.targetUrl)){
            'undefined'!==typeof dwsChmExtBg&&dwsChmExtBg.enableBgDebug ?alert(str):false;
            //本地调试用,记得关闭
            console.log(str);
            return;
        }
        str = (this.isCurRunInBg ? '后台(' + this.targetUrl + '):' : '前台(' + this.targetUrl + '):') + str;
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
        //回调函数转字符串作为参数传递
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
