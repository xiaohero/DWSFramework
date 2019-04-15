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
    run() {
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
        let bgJsCode = 'dwsChmExtBgUtil.getWebSocket("' + myUtils.getTargetCurrentUrl() + '").sendMessage(' + JSON.stringify(sendData) + ')';
        myUtils.extExeGlobalJs(bgJsCode, result => {});
    }

    //检测用户是否平台在线
    checkUserlogged() {
        return false;
    }

    //获取当前页面唯一uuid
    getCurPageUUID() {
        return '';
    }

    getFloatValue(value) {
        let newValue = ('' + value).trim().replace(',', '').replace(' ', '');
        let matchRet = newValue.match(/(\d+(\.\d+)?)/g);
        if (!matchRet) {
            // myUtils.log('警告，未提取到浮点型数值!');
            return 0;
        }
        newValue = matchRet[0];
        newValue = parseFloat(newValue).toFixed(9);
        return newValue;
    }

    getFloatValueByJqStr(jqStr) {
        return this.getFloatValue(myUtils.jqHelpFind(jqStr).text() ? myUtils.jqHelpFind(jqStr).text() : myUtils.jqHelpFind(jqStr).val());
    }

    getFloatBitsByJqStr(jqStr) {
        let value = myUtils.jqHelpFind(jqStr).text() ? myUtils.jqHelpFind(jqStr).text() : myUtils.jqHelpFind(jqStr).val();
        let newValue = ('' + value).trim().replace(',', '').replace(' ', '');
        let matchRet = newValue.match(/(\d+(\.\d+)?)/g);
        if (!matchRet) {
            myUtils.log('警告，未提取到浮点型数值!');
            return 0;
        }
        newValue = matchRet[0];
        let valueBits = 0;
        if (-1 !== newValue.indexOf('.')) {
            valueBits = newValue.substr(newValue.indexOf('.') + 1).length;
        }
        myUtils.log('调试:jqStr:' + jqStr + ',值:' + newValue + ',小数位数:' + valueBits);
        return valueBits;
    }
}
