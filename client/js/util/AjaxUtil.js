// javascript-obfuscator:disable
/**Ajax helper class**/
if ('undefined' == typeof AjaxUtil) {
    class AjaxUtil {
        constructor() {
        }

        x() {
            if (typeof XMLHttpRequest !== 'undefined') {
                return new XMLHttpRequest();
            }
            let versions = [
                "MSXML2.XmlHttp.6.0",
                "MSXML2.XmlHttp.5.0",
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0",
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"
            ];
            let xhr;
            for (let i = 0; i < versions.length; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                } catch (e) {
                }
            }
            return xhr;
        }

        send(url, callback, method, data, async = true) {
            if (async === undefined) {
                async = true;
            }
            let x = this.x();
            x.open(method, url, async);
            //set true,auto add cookie in http header
            //x.withCredentials = true;
            x.onreadystatechange = function () {
                if (x.readyState == 4) {
                    callback(x.responseText)
                }
            };
            if (method == 'POST') {
                x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
            }
            x.send(data);
        };

        get(url, data, callback, async = true) {
            let query = [];
            data = data || {};
            callback = callback || (() => {
            });
            for (let key in data) {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
            // query.push('_='+new Date().getTime());//prevent caching
            this.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, async);
        };

        post(url, data, callback, async = true) {
            let query = [];
            data = data || {};
            callback = callback || (() => {
            });
            for (let key in data) {
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
            this.send(url, callback, 'POST', query.join('&'), async)
        };

        fetchGet(url, data, callback) {
            fetch(url, {
                method: 'GET',
                mode: 'no-cors',//no-cors,cors
                headers: {
                    'Content-Type': 'application/json; charset=utf-8'
                    //'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                },
                body: data
            }).then(function (res) {
                console.log('Response succeeded:', JSON.stringify(res.ok));
                console.log(JSON.stringify(res));
                callback(res);
            }).catch(function (e) {
                console.log('fetch fail:', JSON.stringify(e));
            });
        }

    }
    //create AjaxUtil instance
    ajaxUtil = new AjaxUtil();
}
// javascript-obfuscator:enable