/**本框架文件乃自研"DWS框架"简化版(脱机,离线版),
 * 如需商业用途请咨询开发作者,
 * 可获取完整版(支持websocket实时通信，支持https转http，支持去服务端iframe保护,
 * 支持前端后端消息转发,支持后端全局变量存取,支持获取插件唯一id,支持http request,
 * http response head,body等截取,还自动集成了常用第三方前端js库:如jquery,babel,react,vue等
 * )并持续更新维护:2019-07-31 作者:西大神(QQ:2130622841)
 * **/

/**chrome扩展动态js注入工具类(通用前台基类)**/
class BaseChmExtFt {
    constructor() {
        this.ftListenEvent();
    }

    ftListenEvent() {
        //2.全局通信封装
        window.addEventListener('message', (event) => {
            // We only accept messages from ourselves
            // console.log('事件详情：'+JSON.stringify(event));
            // console.dir(event);
            if (event.source != window) {
                // console.log(window.location.href+'(收到消息),其它事件内容：'+JSON.stringify(event.data));
                // console.dir(event);
                // return;
            }
            if ('object' != typeof event.data || 'string' != typeof event.data.type || 'FROM_PAGE' != event.data.type) {
                return;
            }
            if ('string' != typeof event.data.funcName || 'string' != typeof event.data.varName) {
                return;
            }
            // console.log('chrome_ext_front 收到页面消息: ' + JSON.stringify(event.data));
            this.invokeGlobalFun(event.data);
        });
    }

    invokeGlobalFun(eventData) {
        // console.log('chrome_ext_front 调试:invokeGlobalFun:' + JSON.stringify(eventData)+',callback:'+typeof eventData.callback);
        chrome.runtime.sendMessage(eventData, (result) => {
            if ('string' == typeof eventData.callback) {
                let exeJsCode = '(' + decodeURI(eventData.callback) + ')(' + result + ');';
                if (eventData.debug) {
                    console.log('chrome_ext_front exe callback js:' + exeJsCode, 'type of result:' + typeof result);
                }
                window.eval(exeJsCode);
            }
        });
    }

    invokeGlobalJs(jsStr, callback) {
        'function' === typeof callback ?
            this.invokeGlobalFun({
                    type: 'FROM_PAGE',
                    funcName: 'nothing',
                    varName: 'jsCode',
                    varValue: jsStr,
                    callback: encodeURI(callback.toString())
                }
            ) : this.invokeGlobalFun({
                type: 'FROM_PAGE',
                funcName: 'nothing',
                varName: 'jsCode',
                varValue: jsStr
            }
        );
    }
}

class DwsChmExtFt extends BaseChmExtFt{
    constructor() {
        super();
        this.init();
    }

    init() {
        this.enterGame();
    }

    enterGame(){
       //完整版提供websocket动态植入前端js
    }
}

dwsChmExtFt = new DwsChmExtFt();

