class BaseClientService {
    //构造函数
    constructor() {
        //myUtils.log('进入 BaseClientService 构造方法');
        if (this.constructor === BaseClientService) {
            // Error Type 1. Abstract class can not be constructed.
            throw new TypeError('Can not construct abstract class.');
        }
        if (this.run === BaseClientService.prototype.run) {
            // Error Type 4. Child has not implemented this abstract method.
            throw new TypeError('Please implement abstract method run.');
        }
    }

    //入口程序，子类需实现该方法
    run(){
        console.log('warning:client should implement this abstract method!');
    }

    wsSendMessage(sendData) {
        // console.log('准备发消息给服务器:'+JSON.stringify(sendData));
        if (!sendData) {
            return false;
        }
        if (!myUtils.getDwsChmExtVersion()) {
            // alert('发送错误，请先安装DWS谷歌插件!');
            return false;
        }
        let bgJsCode = 'dwsChmExtBg.getWebSocket().sendMessage(' + JSON.stringify(sendData) + ')';
        myUtils.extExeGlobalJs(bgJsCode, (result) => {
        });
    }

    //检测用户是否平台在线
    checkUserlogged() {
        return false;
    }

    //获取当前页面唯一uuid
    getCurPageUUID(){
        return '';
    }
}