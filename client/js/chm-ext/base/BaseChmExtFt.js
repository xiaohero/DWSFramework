/* javascript-obfuscator:disable */
/**Chrome extension dynamic js injection tool class (generic foreground base class)**/
class BaseChmExtFt {
    constructor() {
        this.ftListenEvent();
    }

    ftListenEvent() {
        //2.global communication encapsulation
        window.addEventListener('message', (event) => {
            // We only accept messages from ourselves
            // console.log('Event details：'+JSON.stringify(event));
            // console.dir(event);
            if (event.source != window) {
                // console.log(window.location.href+'(message received), other event content：'+JSON.stringify(event.data));
                // console.dir(event);
                // return;
            }
            if ('object' != typeof event.data || 'string' != typeof event.data.type || 'FROM_PAGE' != event.data.type) {
                return;
            }
            if ('string' != typeof event.data.funcName || 'string' != typeof event.data.varName) {
                return;
            }
            // console.log('chrome_ext_front get page message: ' + JSON.stringify(event.data));
            this.invokeGlobalFun(event.data);
        });
    }

    invokeGlobalFun(eventData) {
        // console.log('chrome_ext_front debug:invokeGlobalFun:' + JSON.stringify(eventData)+',callback:'+typeof eventData.callback);
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
/* javascript-obfuscator:enable */