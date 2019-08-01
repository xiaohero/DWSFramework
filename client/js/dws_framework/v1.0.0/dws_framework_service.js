/**本框架文件乃自研"DWS框架"简化版(脱机,离线版),
 * 如需商业用途请咨询开发作者,
 * 可获取完整版(支持websocket实时通信，支持https转http，支持去服务端iframe保护,
 * 支持前端后端消息转发,支持后端全局变量存取,支持获取插件唯一id,支持http request,
 * http response head,body等截取,还自动集成了常用第三方前端js库:如jquery,babel,react,vue等
 * )并持续更新维护:2019-07-31 作者:西大神(QQ:2130622841)
 * **/
///////////////////////业务service基类
class CommonClientService{
    //构造函数
    constructor() {
        // myUtils.log('进入 CommonClientService 构造方法');
        //网络监控相关业务参数
        this.nwMatchReqRegStr='XHR';
        this.nwMatchResRegStr='';
        //其它
        myUtils.log('命中当前网页:'+window.location.href);
    }

    async run(){
        //开启视频采集监控
        this.monitorNetWork();
        // alert('命中当前网页:'+window.location.href);
    }

    onNetworkCaptureSuccess(response){
        myUtils.log('捕获到目标url返回值如下:');
        myUtils.log(decodeURI(response));
        return decodeURI(response);
    }

    monitorNetWork(strReqReg,strResReg,cbFunc) {
        myUtils.log('开启当前页面网络监控...');
        'undefined'===typeof strReqReg?strReqReg=this.nwMatchReqRegStr:false;
        'undefined'===typeof strResReg?strResReg=this.nwMatchResRegStr:false;
        //辅助变量,确保只弹出一次
        window.confirmCount=0;
        if('undefined' === typeof cbFunc){
            // javascript-obfuscator:disable
            cbFunc = (frontUrl,resp) => {
                //注意:当前作用域在后台
                frontUrl&&resp&&dwsChmExtBg.sendJsToPageByUrl(frontUrl,'clientService.onNetworkCaptureSuccess("'+resp+'");');
            };
            // javascript-obfuscator:enable
        }
        let bgJsCode = 'dwsChmExtBg.enableNetworkMonitorByUrl("'+myUtils.getTargetCurrentUrl()+'","'+strReqReg+'","'+strResReg+'",'+cbFunc.toString()+',false);';
        //alert(bgJsCode);
        myUtils.extExeGlobalJs(bgJsCode, (ret)=> {});
    }
}
