/**Tools**/
function MyUtils() {
};

/*logging tool*/
MyUtils.prototype.log = function (str, notLogToTopPage) {
    if (!str) {
        return;
    }
    let curDate = MyUtils.prototype.formatDate((new Date()), 'yyyy-MM-dd hh:mm:ss');
    let tmpStr = MyUtils.prototype.checkDwsChmExtRunInBg() ? 'BGD:' : 'FTD:';
    // if('FTD:'==tmpStr){//code for testing and debugging
    //     return;
    // }
    console.log(curDate + '-->' + tmpStr + str);
    //log output to page
    if (!notLogToTopPage) {
        MyUtils.prototype.logTopPage(str);
    }
};

MyUtils.prototype.dir = function (obj) {
    let curDate = MyUtils.prototype.formatDate((new Date()), 'yyyy-MM-dd hh:mm:ss');
    console.log(curDate + '----object--info---');
    console.dir(obj);
};

/*format date:formatDate((new Date()),'yyyy-M-d hh:mm:ss')*/
MyUtils.prototype.formatDate = function (date, format) {
    if (!format) {
        format = "yyyy-MM-dd hh:mm:ss";
    }
    let o = {
        "M+": date.getMonth() + 1,  // month
        "d+": date.getDate(),       // day
        "H+": date.getHours(),      // hour
        "h+": date.getHours(),      // hour
        "m+": date.getMinutes(),    // minute
        "s+": date.getSeconds(),    // second
        "q+": Math.floor((date.getMonth() + 3) / 3), // quarter
        "S": date.getMilliseconds()
    };

    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (date.getFullYear() + "")
            .substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1
                ? o[k]
                : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return format;
};

/*A string to format a CST date*/
MyUtils.prototype.formatCSTDate = function (strDate, format) {
    return MyUtils.prototype.formatDate(new Date(strDate), format);
};

/*url extracts parameters and returns a json object*/
MyUtils.prototype.getJsonFromUrl = function (url = '') {
    url || (url = location.href);
    let question = url.indexOf("?");
    let hash = url.indexOf("#");
    let result = {};
    if (hash == -1 && question == -1) {
        return result;
    }
    (hash == -1) && (hash = url.length);
    let query = question == -1 || hash == question + 1 ? url.substring(hash) :
        url.substring(question + 1, hash);
    query.split("&").forEach(function (part) {
        if (!part) {
            return;
        }
        part = part.split("+").join(" "); // replace every + with space, regexp-free version
        let eq = part.indexOf("=");
        let key = eq > -1 ? part.substr(0, eq) : part;
        let val = eq > -1 ? decodeURIComponent(part.substr(eq + 1)) : "";
        let from = key.indexOf("[");
        if (from == -1) {
            result[decodeURIComponent(key)] = val;
        } else {
            let to = key.indexOf("]", from);
            let index = decodeURIComponent(key.substring(from + 1, to));
            key = decodeURIComponent(key.substring(0, from));
            (!result[key]) && (result[key] = []);
            if (!index) {
                result[key].push(val);
            } else {
                result[key][index] = val;
            }
        }
    });
    return result;
};

/*Addition function*/
MyUtils.prototype.accAdd = function (arg1, arg2, autoFixed = false) {
    let calcRet = 0;
    if ('object' === typeof math && 'function' === typeof math.add) {
        calcRet = math.add(arg1, arg2);
    } else {
        let r1, r2, m;
        try {
            r1 = arg1.toString().split(".")[1].length;
        } catch (e) {
            r1 = 0;
        }
        try {
            r2 = arg2.toString().split(".")[1].length;
        } catch (e) {
            r2 = 0;
        }
        m = Math.pow(10, Math.max(r1, r2));
        calcRet = (arg1 * m + arg2 * m) / m;
    }
    if (autoFixed) {
        //Find the maximum number of decimal places
        function findDec(f1) {
            function isInt(n) {
                return typeof n === 'number' &&
                    parseFloat(n) == parseInt(n, 10) && !isNaN(n);
            }

            let a = Math.abs(f1);
            f1 = a, count = 1;
            while (!isInt(f1) && isFinite(f1)) {
                f1 = a * Math.pow(10, count++);
            }
            return count - 1;
        }

        //Determine the greatest number of decimal places
        let dec1 = findDec(arg1);
        let dec2 = findDec(arg2);
        let fixed = dec1 > dec2 ? dec1 : dec2;
        //calcRet = calcRet.toFixed(fixed);
        calcRet = parseFloat(calcRet.toFixed(fixed));
    }
    return calcRet;
};

/*subtraction function*/
MyUtils.prototype.accSub = function (arg1, arg2) {
    if ('object' === typeof math && 'function' === typeof math.subtract) {
        return math.subtract(arg1, arg2);
    }
    let r1, r2, m, n;
    try {
        r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
        r1 = 0;
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
        r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    /*last modify by deeka
     Dynamic control precision length*/
    n = (r1 >= r2) ? r1 : r2;
    return ((arg1 * m - arg2 * m) / m).toFixed(n);
};

/*Multiplication function*/
MyUtils.prototype.accMul = function (arg1, arg2) {
    if ('object' === typeof math && 'function' === typeof math.multiply) {
        return math.multiply(arg1, arg2);
    }
    MyUtils.prototype.log('Warning: The math.js library has not been introduced, and floating-point multiplication may have errors!');
    return arg1 * arg2;
    //There is a bug in the multiplication function circulating on the Internet below
    let m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try {
        m += s1.split(".")[1].length;
    } catch (e) {
    }
    try {
        m += s2.split(".")[1].length;
    } catch (e) {
    }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
};

/*division function*/
MyUtils.prototype.accDiv = function (arg1, arg2) {
    if ('object' === typeof math && 'function' === typeof math.divide) {
        return math.divide(arg1, arg2);
    }
    let t1 = 0, t2 = 0, r1, r2;
    try {
        t1 = arg1.toString().split(".")[1].length;
    } catch (e) {
    }
    try {
        t2 = arg2.toString().split(".")[1].length;
    } catch (e) {
    }

    r1 = Number(arg1.toString().replace(".", ""));
    r2 = Number(arg2.toString().replace(".", ""));
    return (r1 / r2) * Math.pow(10, t2 - t1);

};

MyUtils.prototype.exit = function (status) {
    //http://kevin.vanzonneveld.net
    let i;
    if (typeof status === 'string') {
        alert(status);
    }
    window.addEventListener('error', function (e) {
        e.preventDefault();
        e.stopPropagation();
    }, false);
    let handlers = [
        'copy', 'cut', 'paste',
        'beforeunload', 'blur', 'change', 'click', 'contextmenu', 'dblclick', 'focus', 'keydown', 'keypress', 'keyup', 'mousedown', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'resize', 'scroll',
        'DOMNodeInserted', 'DOMNodeRemoved', 'DOMNodeRemovedFromDocument', 'DOMNodeInsertedIntoDocument', 'DOMAttrModified', 'DOMCharacterDataModified', 'DOMElementNameChanged', 'DOMAttributeNameChanged', 'DOMActivate', 'DOMFocusIn', 'DOMFocusOut', 'online', 'offline', 'textInput',
        'abort', 'close', 'dragdrop', 'load', 'paint', 'reset', 'select', 'submit', 'unload'
    ];

    function stopPropagation(e) {
        e.stopPropagation();
        // e.preventDefault(); // Stop for the form controls, etc., too?
    }

    for (i = 0; i < handlers.length; i++) {
        window.addEventListener(handlers[i], function (e) {
            stopPropagation(e);
        }, true);
    }
    if (window.stop) {
        window.stop();
    }
    throw '';
};


/*wait for an element to appear (visible)*/
MyUtils.prototype.waitForElementVisible = function (jqStrElement, callbackFunc, msTimeout) {
    msTimeout = parseInt(msTimeout) > 0 ? parseInt(msTimeout) : 30000;
    let tmpTimerCount = 0;
    let tmpTimerCheckGapMs = 10;
    let tmpTimer = setInterval(() => {
        if (++tmpTimerCount * tmpTimerCheckGapMs > msTimeout) {
            // MyUtils.prototype.log('Visible element not detected:' + jqStrElement + '(detection timeout)!');
            clearInterval(tmpTimer);
            callbackFunc(false);
            return;
        }
        let jqFindObj = MyUtils.prototype.jqHelpFind(jqStrElement);
        if (jqFindObj.length && jqFindObj.is(':visible')) {
            // myUtils.log('Visible element detected:' + jqStrElement);
            // jqFindObj.click();
            clearInterval(tmpTimer);
            callbackFunc(jqFindObj);
        }
    }, tmpTimerCheckGapMs);
};

/*wait for an element to appear (visible)*/
MyUtils.prototype.waitForElementAndClick = function (jqStrElement, clickModel, afterClickLog, notFoundLog, msTimeout, callbackFunc) {
    clickModel = ('event' == clickModel ? clickModel : 'click');
    afterClickLog = afterClickLog ? afterClickLog : 'found(' + jqStrElement + ')element and click';
    notFoundLog = notFoundLog ? notFoundLog : 'not found(' + jqStrElement + ')element(detection timeout)';
    msTimeout = parseInt(msTimeout) > 0 ? parseInt(msTimeout) : 0;
    MyUtils.prototype.waitForElementVisible(jqStrElement, function (findJqObj) {
        if (!findJqObj) {
            MyUtils.prototype.log(notFoundLog);
            'function' == typeof callbackFunc ? callbackFunc(findJqObj) : false;
            return;
        }
        'event' == clickModel ? MyUtils.prototype.eventFire(findJqObj.get(0), 'click') : findJqObj.click();
        MyUtils.prototype.log(afterClickLog);
        'function' == typeof callbackFunc ? callbackFunc(findJqObj) : false;
    }, msTimeout)
};


/*Obsolete*/
MyUtils.prototype.waitAndPageReloadClick = function (jqStrElement, jqObjIframe, msTimeout, callbackFunc) {
    msTimeout = parseInt(msTimeout) > 0 ? parseInt(msTimeout) : 30;
    let timeCount = 0;
    let tmpTimer = setInterval(function () {
        // MyUtils.prototype.log('Whether the page is reloaded:'+window.performance.navigation.type);
        timeCount += 1;
        if (timeCount > msTimeout) {
            MyUtils.prototype.log('not found:' + jqStrElement + 'element，Please press F5 to refresh the page!');
            clearInterval(tmpTimer);
            return;
        }
        let jqElement = MyUtils.prototype.jqHelpFind(jqStrElement);
        if (jqElement.length) {
            // if(callbackFunc){
            //     callbackFunc();
            // }
            // clearInterval(tmpTimer);
            jqElement.click();
            // MyUtils.prototype.log('click count：'+timeCount);
        }
    }, 10);
    //Check if the click event has caused the page to refresh
    MyUtils.prototype.beforeIframeReload(jqObjIframe, function () {
        MyUtils.prototype.log('Detect page refresh, click success, close the timer');
        clearInterval(tmpTimer);
    });
};


/*Sleep for N milliseconds, synchronously blocking the process*/
MyUtils.prototype.sleepSync = async function (ms) {
    for (let t = Date.now(); Date.now() - t <= ms;) ;
    // (async ()=>{return MyUtils.prototype.log('xxx');await MyUtils.prototype.sleepSyncPromise(5000);})();

};

/*Sleep for N milliseconds, synchronization does not block the process*/
MyUtils.prototype.sleepSyncPromise = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};


/*sleep N milliseconds, async*/
MyUtils.prototype.sleepAsync = function (callbackFunc, ms) {
    setTimeout(callbackFunc, ms);
    // (function my_func() {
    //     //normal logic code
    //     //xxxxxxxxx
    //     if(true){
    //         setTimeout(my_func, ms);
    //     }
    // })();
};


/*String to remove all spaces*/
MyUtils.prototype.strTrimAll = function (str) {
    return str.replace(/\s+/g, "");
};

/*String remove numbers + letters*/
MyUtils.prototype.strRemoveNumAlpha = function (str) {
    return str.replace(/[^0-9a-zA-Z]+/g, "");
};

/*Convert local img image url to base64*/
MyUtils.prototype.imgUrlToBase64 = function (url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onload = function () {
        let reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
};

MyUtils.prototype.toDataURL = function (src, callback, outputFormat) {
    let img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function () {
        let canvas = document.createElement('CANVAS');
        let ctx = canvas.getContext('2d');
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        ctx.drawImage(this, 0, 0);
        let dataURL = canvas.toDataURL(outputFormat);
        callback(dataURL);
    };
    img.src = src;
    if (img.complete || img.complete === undefined) {
        img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        img.src = src;
    }
};

// <yzmImg id="preview" src="http://www.gravatar.com/avatar/0e39d18b89822d1d9871e0d1bc839d06?s=128&d=identicon&r=PG">
// <canvas id="myCanvas" />
/*Convert local img image to base64*/
MyUtils.prototype.imgLabelToBase64 = function (jqStrImg, removeHeader = false) {
    if (MyUtils.prototype.jqHelpFind('#myCanvas').length < 1) {
        MyUtils.prototype.jqHelpFind('body').append("<canvas id='myCanvas'></canvas>");
    }
    let myCanvas = MyUtils.prototype.jqHelpFind('#myCanvas').get(0);
    let ctx = myCanvas.getContext('2d');
    let yzmImg = MyUtils.prototype.jqHelpFind(jqStrImg).get(0);
    ctx.width = yzmImg.width;
    ctx.height = yzmImg.height;
    ctx.drawImage(yzmImg, 0, 0);
    let returnStr = myCanvas.toDataURL();
    if (removeHeader) {
        returnStr = returnStr.replace('data:image/png;base64,', '');
    }
    console.log('img(' + jqStrImg + ') base64:');
    console.dir(returnStr);
    //remove added canvas
    MyUtils.prototype.jqHelpFind('#myCanvas').remove();
    return returnStr;
};

/*jsonp client custom data sending server*/
MyUtils.prototype.jsonpUploadServerData = function (clientData) {
    let host = 'http://127.0.0.1:8080/SSHGJ/my/onlineGm/jsonUtil';
    MyUtils.prototype.getJQuery().ajax({
        type: 'POST',
        url: host,
        data: {jsonParams: JSON.stringify(clientData)},
        dataType: 'jsonp',
        jsonp: 'jsonUtilCallBackParam',
        /*jsonpCallbackString:'jsonUtilCallbackFunc',*/
        success: function (msg) {
            console.log('The request is successful and the result is returned:' + JSON.stringify(msg));
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log('request failed, interface request error:' + JSON.stringify(errorThrown));
        }
    });
};

/*jq assisted lookup*/
MyUtils.prototype.jqHelpFind = function (jqStr, getText = false) {
    /*Special support $ delimited followed by property name*/
    let jqFieldStr = '';
    if (getText && -1 !== jqStr.indexOf('$') && 2 == jqStr.split('$').length) {
        jqStr = jqStr.split('$')[0];
        jqFieldStr = jqStr.split('$')[1];
    }
    let isXpathStr = ('string' == typeof jqStr && jqStr.match(/^\/\//)) ? true : false;
    let funcName = isXpathStr ? 'xpath' : 'find';//Compatible with both css and xpath selectors
    /*Search own domain first*/
    if (MyUtils.prototype.getJQuery(window.document)[funcName](jqStr).length) {
        return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(window.document)[funcName](jqStr).attr(jqFieldStr) : MyUtils.prototype.getJQuery(window.document)[funcName](jqStr).text()) : MyUtils.prototype.getJQuery(window.document)[funcName](jqStr);
    }
    /*Search subdomains*/
    if (window.frames.length > 0) {
        try {
            for (let idx = 0; idx < window.frames.length; idx++) {
                if (MyUtils.prototype.getJQuery(window.frames[idx].document)[funcName](jqStr).length) {
                    return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(window.frames[idx].document)[funcName](jqStr).attr(jqFieldStr) : MyUtils.prototype.getJQuery(window.frames[idx].document)[funcName](jqStr).text()) : MyUtils.prototype.getJQuery(window.frames[idx].document)[funcName](jqStr);
                }
            }
        } catch (e) {

        }
    }
    /*Search parent domains*/
    try {
        /*Catch the exception, it may not be accessible across domains*/
        if (MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr).length) {
            return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr).attr(jqFieldStr) : MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr).text()) : MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr);
        }
    } catch (e) {

    }
    return getText ? '' : [];
};


/*jq assisted lookup*/
MyUtils.prototype.jqHelpInnerFind = function (jqTarget, jqStr, getText = false) {
    /*Special support $ delimited followed by property name*/
    let jqFieldStr = '';
    if (getText && -1 !== jqStr.indexOf('$') && 2 == jqStr.split('$').length) {
        jqFieldStr = jqStr.split('$')[1];
        jqStr = jqStr.split('$')[0];
    }
    //console.log(jqStr+'=>'+jqStr.split('$').length+',jqStr:'+jqStr+',jqFieldStr:'+jqFieldStr);
    let isXpathStr = ('string' == typeof jqStr && jqStr.match(/^\/\//)) ? true : false;
    let funcName = isXpathStr ? 'xpath' : 'find';//Compatible with both css and xpath selectors
    if (MyUtils.prototype.getJQuery(jqTarget).length < 1) {
        return getText ? '' : [];
    }
    /*own dom search*/
    if (!jqStr) {
        return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(jqTarget).attr(jqFieldStr) : MyUtils.prototype.getJQuery(jqTarget).text()) : MyUtils.prototype.getJQuery(jqTarget);
    }
    /*Search own domain*/
    if (MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr).length > 0) {
        return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr).attr(jqFieldStr) : MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr).text()) : MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr);
    }
    return getText ? '' : [];
};

/*Get the target window object variable or function*/
MyUtils.prototype.winHelpGet = function (winObjOrFunName) {
    /*Search own domain first*/
    if (window[winObjOrFunName]) {
        return window[winObjOrFunName];
    }
    /*Search subdomains*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (window.frames[idx][winObjOrFunName]) {
                return window.frames[idx][winObjOrFunName];
            }
        }
    }
    /*Search parent domains*/
    try {
        /*Catch the exception, it may not be accessible across domains*/
        if (window.parent[winObjOrFunName]) {
            return window.parent[winObjOrFunName];
        }
    } catch (e) {

    }
    return false;
};

/*Set the target window's object variable or function value*/
MyUtils.prototype.winHelpSet = function (winObjOrFunName, valueObOrFun) {
    /*Search own domain first*/
    if (window[winObjOrFunName]) {
        return window[winObjOrFunName] = valueObOrFun;
    }
    /*Search subdomains*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (window.frames[idx][winObjOrFunName]) {
                return window.frames[idx][winObjOrFunName] = valueObOrFun;
            }
        }
    }
    /*Search parent domains*/
    try {
        /*Catch the exception, it may not be accessible across domains*/
        if (window.parent[winObjOrFunName]) {
            return window.parent[winObjOrFunName] = valueObOrFun;
        }
    } catch (e) {

    }
    return false;
};

/*Get the top-level website host*/
MyUtils.prototype.getTopFullHost = function () {
    /*Search own domain first*/
    let serverFullHost = window.location.protocol + '//' + window.location.host;
    return serverFullHost;
};

/*Get top 1 website url*/
MyUtils.prototype.getTopCurrentUrl = function () {
    return window.location.href;
};

MyUtils.prototype.topIsServer = function () {
    /*Search your own domain first*/
    let serverFullHost = MyUtils.prototype.getTopFullHost();
    return /\d+.\d+.\d+.\d+/.test(serverFullHost) ? serverFullHost : false;
};

/*Get the target website host*/
MyUtils.prototype.getTargetHost = function () {
    /*Search own domain first*/
    if (!/(\d.\d.\d.\d)|(localhost)/.test(window.location.host)) {
        return window.location.host;
    }
    /*Search subdomains*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (!/(\d.\d.\d.\d)|(localhost)/.test(window.frames[idx].location.host)) {
                return window.frames[idx].location.host;
            }
        }
    }
    /*Search parent domains*/
    try {
        /*Catch the exception, it may not be accessible across domains*/
        if (!/(\d.\d.\d.\d)|(localhost)/.test(window.parent.location.host)) {
            return window.parent.location.host;
        }
    } catch (e) {

    }
    return window.location.host;
};

/*Get the target website host*/
MyUtils.prototype.getTargetFullHost = function () {
    /*Search your own domain first*/
    if (!/(\d.\d.\d.\d)|(localhost)/.test(window.location.host)) {
        return window.location.protocol + '//' + window.location.host;
    }
    /*Search subdomains*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (!/(\d.\d.\d.\d)|(localhost)/.test(window.frames[idx].location.host)) {
                return window.frames[idx].location.protocol + '//' + window.frames[idx].location.host;
            }
        }
    }
    /*Search parent domains*/
    try {
        /*Catch the exception, it may not be accessible across domains*/
        if (!/(\d.\d.\d.\d)|(localhost)/.test(window.parent.location.host)) {
            return window.parent.location.protocol + '//' + window.parent.location.host;
        }
    } catch (e) {

    }
    return window.location.protocol + '//' + window.location.host;

};

/*Get the full path of the target website url*/
MyUtils.prototype.getTargetCurrentUrl = function () {
    /*Search your own domain first*/
    if (!/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|(localhost)/.test(window.location.href)) {
        return window.location.href;
    }
    /*Search subdomains*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (!/(\d.\d.\d.\d)|(localhost)/.test(window.frames[idx].location.href)) {
                return window.frames[idx].location.href;
            }
        }
    }
    /*Search parent domains*/
    try {
        /*Catch the exception, it may not be accessible across domains*/
        if (!/(\d.\d.\d.\d)|(localhost)/.test(window.parent.location.href)) {
            return window.parent.location.href;
        }
    } catch (e) {

    }
    return window.location.href;

};

/*关闭当前页面*/
MyUtils.prototype.closeCurrentPage = function () {
    /*close the current page*/
    let userAgent = navigator.userAgent;
    if (userAgent.indexOf("Firefox") != -1 || userAgent.indexOf("Chrome") != -1) {
        window.location.href = "about:blank";
    } else {
        window.opener = null;
        window.open('', '_self');
        window.close();
    }
    /************/
};

/*page refresh*/
MyUtils.prototype.reload = function (iframeName) {
    // console.log('page refresh skip');return;
    if (!MyUtils.prototype.isIframeSupport(iframeName)) {
        MyUtils.prototype.log('iframe not found:(' + iframeName + '),Refresh the top-level page directly!');
        MyUtils.prototype.extExeGlobalJs('dwsChmExtBg.flushParentWindowByFrameUrl("' + window.location + '")');
        window.location.reload();
        return;
    }
    // if ('undefined' != typeof iframeName && 'undefined'==typeof window.frames[iframeName]) {
    //     MyUtils.prototype.log('iframe not found:('+iframeName+'),This page refresh is skipped!');
    //     return;
    // }

    // let whichWindow = iframeName ? window.frames[iframeName].window : window;
    // whichWindow.location.reload();
    window.frames[iframeName].window.reload();
};

/*Intercept ajax page success message*/
MyUtils.prototype.afterAjaxSuccess = function (callbackFunc, jqStr) {
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            MyUtils.prototype.log('ajax request completed...');
            console.dir(arguments);
        }
    }
    jqStr = jqStr ? jqStr : document;
    MyUtils.prototype.getJQuery(jqStr).ajaxSuccess(callbackFunc);
};

MyUtils.prototype.afterIframeLoad = function (jqObjIframe, callbackFunc) {
    if (jqObjIframe.length < 1) {
        MyUtils.prototype.log('The specified iframe was not found and the load event could not be registered...');
        return;
    }
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            MyUtils.prototype.log('iframe loaded complete...');
            console.dir(arguments);
        }
    }
    let tempFunc = function () {
        if (callbackFunc) {
            callbackFunc(arguments);
        }
        jqObjIframe.off('load', tempFunc);
    };
    jqObjIframe.on('load', tempFunc);
};

MyUtils.prototype.beforeIframeReload = function (jqObjIframe, callbackFunc) {
    if (jqObjIframe.length < 1) {
        MyUtils.prototype.log('The specified iframe was not found and the beforeunload event could not be registered...');
        return;
    }
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            // MyUtils.prototype.log('iframe is about to refresh...');
            console.dir(arguments);
        }
    }
    let tempFunc = function () {
        if (callbackFunc) {
            callbackFunc(arguments);
        }
        MyUtils.prototype.getJQuery(jqObjIframe.get(0).contentWindow).off('beforeunload', tempFunc);
        // jqObjIframe.off('unload', tempFunc);
    };
    MyUtils.prototype.getJQuery(jqObjIframe.get(0).contentWindow).on('beforeunload', tempFunc);
    //    jqObjIframe.on('unload', tempFunc);
    // jqObjIframe.get(0).contentWindow.onbeforeunload=tempFunc;

};

MyUtils.prototype.afterIframeReady = function (jqObjIframe, callbackFunc) {
    if (jqObjIframe.length < 1) {
        MyUtils.prototype.log('The specified iframe was not found and the ready event could not be registered...');
        return;
    }
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            MyUtils.prototype.log('iframe loaded complete...');
            console.dir(arguments);
        }
    }
    let tempFunc = function () {
        if (callbackFunc) {
            callbackFunc(arguments);
        }
        //jqObjIframe.off('ready', tempFunc);
    };
    jqObjIframe.ready(tempFunc);
};


/*Dynamically execute Reactjs code*/
MyUtils.prototype.dynExecuteReactJs = function (reactJsCode, newReactjsEleId) {
    newReactjsEleId = newReactjsEleId ? newReactjsEleId : 'myReactJs';
    let reactJsObj = MyUtils.prototype.jqHelpFind('#' + newReactjsEleId);
    if (reactJsObj.length > 0) {
        reactJsObj.remove();
    }
    let script = document.createElement('script');
    script.id = newReactjsEleId;
    script.type = 'text/babel';
    script.src = 'http://127.0.0.1:8000/static/js/account/test.js';
    // script.text = "ReactDOM.render( <h1>Hello, world!</h1>,document.getElementById('login'));";
    // script.text = "alert(111)";
    // script.async = true;
    MyUtils.prototype.getJQuery('body').append(script);
};

/*play music*/
MyUtils.prototype.playMusic = function (musicUrl = '') {
    if (!musicUrl) {
        MyUtils.prototype.log('Warning: No music playback url provided, playback failed....',true);
        return false;
    }
    let musicObj = MyUtils.prototype.jqHelpFind('#objMusic');
    if (!musicObj.length) {
        /*Inject playback controls*/
        let htmlPlayMusic = '<audio id="objMusic" src="">你的浏览器暂不支持音乐播放,请升级</audio>';
        if (MyUtils.prototype.jqHelpFind('body').append(htmlPlayMusic)) {
            MyUtils.prototype.log('Injected music playback controls successfully....',true);
        } else {
            MyUtils.prototype.log('Warning: Failed to inject music playback controls....',true);
            return false;
        }
    }
    musicObj = MyUtils.prototype.jqHelpFind('#objMusic');
    if (musicObj.length) {
        musicObj = musicObj.get(0);
        let isPlaying = !musicObj.paused;
        /*Play different music on the front and back*/
        let oldMusicUrl = musicObj.src;
        if (oldMusicUrl == musicUrl && isPlaying) {
            //repeat skip
            MyUtils.prototype.log('Repeat song is playing, skip:' + musicUrl,true);
            return true;
        }
        MyUtils.prototype.log('start playing music:' + musicUrl,true);
        musicObj.src = musicUrl;
        musicObj.play();
    } else {
        MyUtils.prototype.log('Music control not found, failed to play music',true);
    }
};

/*stop music*/
MyUtils.prototype.stopMusic = function () {
    let musicObj = MyUtils.prototype.jqHelpFind('#objMusic');
    if (!musicObj.length) {
        MyUtils.prototype.log('Music controls not found, probably not playing yet, no need to stop....',true);
        return true;
    }
    musicObj = musicObj.get(0);
    musicObj.pause();
    musicObj.currentTime = 0;
    MyUtils.prototype.log('stop music playback:' + musicObj.src,true);
};

/*Dynamically execute js code*/
MyUtils.prototype.loadJsFromUrl = function (jsUrl, jsOnload, jsOnreadystatechange, jsInjectLocation) {
    if ('string' !== typeof jsUrl) {
        return false;
    }
    let scriptTag = document.createElement('script');
    scriptTag.src = jsUrl;
    'function' !== typeof jsOnload ? scriptTag.onload = jsOnload : false;
    'function' !== typeof jsOnreadystatechange ? scriptTag.onreadystatechange = jsOnreadystatechange : false;
    // let dstLocation= ('undefined'!==typeof jsInjectLocation?jsInjectLocation:location);
    let dstLocation = ('undefined' !== typeof jsInjectLocation ? jsInjectLocation : document.head);
    dstLocation.appendChild(scriptTag);
    return true;
};

/*Dynamically execute js code*/
MyUtils.prototype.dynExecuteJsbyUrl = function (url, autoRemove = true) {
    if (!url) {
        return false;
    }
    let script = document.createElement('script');
    // script.id = newReactjsEleId;
    //script.type = 'text/javascript';
    script.setAttribute('type', 'text/javascript');
    script.src = url;
    // support extension like ：chrome-extension://xxx/js/inject.js
    // script.src = chrome.extension.getURL(url);
    // script.async = true;
    script.onload = function () {
        // 放在页面不好看，执行完后移除掉
        autoRemove && this.parentNode.removeChild(this);
    };
    document.getElementsByTagName('head')[0].appendChild(script);
    //document.head.appendChild(temp);
    return true;
};


MyUtils.prototype.hmsToSecondsOnly = function (timeStr) {
    if (!timeStr) {
        return false;
    }
    let p = timeStr.split(':'), s = 0, m = 1;
    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
};

/*Get the current function name*/
MyUtils.prototype.getCurFuncName = function () {
    let stack = new Error().stack;
    let caller = stack.split('\n')[2].trim();
    caller = caller.replace(/(at )/, '');
    return caller;
};


/*Simulate triggering js dom events*/
MyUtils.prototype.eventFire = function (el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        let evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
};

/*Simulate triggering js native click event*/
MyUtils.prototype.simulateClick = function (el) {
    //alert('cls_name:' + MyUtils.prototype.getClsName(el));
    if ('object' !== typeof el) {
        return false;
    }
    let evt = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    });
    el.dispatchEvent(evt);
    return true;
};

MyUtils.prototype.getClsName = function (obj) {
    if ('undefined' === typeof obj) {
        return '';
    }
    return obj.constructor.name;
};


/*Simulate trigger js dom keyboard input event*/
MyUtils.prototype.simulateKeyPress = function (character) {
    jQuery.event.trigger({type: 'keypress', which: character.charCodeAt(0)});
};

MyUtils.prototype.random = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};


//Custom log function, support newline, mainly used to output server log
MyUtils.prototype.logInfos = function (msg, jqStrLog, fontColor) {
    fontColor = fontColor ? fontColor : 'red';
    let jqObj = MyUtils.prototype.jqHelpFind(jqStrLog);
    if (jqObj.length) {
        let curDate = MyUtils.prototype.formatDate((new Date()), 'yyyy-MM-dd hh:mm:ss');
        let appendHtml = '';
        let msgs = msg.split('\n');
        for (let eachLineMsg of msgs) {
            appendHtml += '<span style="color:' + fontColor + '">' + (curDate + ':' + eachLineMsg) + '</span><br/>';
        }
        jqObj.html(appendHtml);
        // jqObj.text(curDate + ':' + msg);
    } else {
        let msgs = msg.split('\n');
        for (let eachLineMsg of msgs) {
            MyUtils.prototype.log(eachLineMsg);
        }
    }
};

//Custom log function, support newline, mainly used to output server log
MyUtils.prototype.logTopPage = function (msg, fontColor) {
    fontColor = fontColor ? fontColor : 'blueviolet';
    let jqObj = MyUtils.prototype.jqHelpFind('#warnMsg');

    //If non-iframe nested, try injecting log div
    if (jqObj.length < 1 && MyUtils.prototype.jqHelpFind('body').length) {
        // console.log('Attempt to inject into page log div');
        MyUtils.prototype.jqHelpFind('body').prepend('<span id="warnMsg" style="text-align:left;"></span>');
    }
    jqObj = MyUtils.prototype.jqHelpFind('#warnMsg');
    if (jqObj.length) {
        let curDate = MyUtils.prototype.formatDate((new Date()), 'yyyy-MM-dd hh:mm:ss');
        let appendHtml = '';
        let msgs = msg.split('\n');
        let a = 0;
        for (let eachLineMsg of msgs) {
            a++;
            if (a == 1) {
                appendHtml += '<span style="color:' + fontColor + ';text-align:left;position: absolute;top:0px;left:0px;z-index:10000" >' + (curDate + ':' + eachLineMsg) + '</span><br/>';
            } else {
                appendHtml += '<span style="color:' + fontColor + ';text-align:left;" aa="' + a + '">' + (curDate + ':' + eachLineMsg) + '</span><br/>';
            }
        }
        jqObj.html(appendHtml);
        // jqObj.text(curDate + ':' + msg);
    }
};

//Get the jQuery global object
MyUtils.prototype.getJQuery = function (jqObj = '') {
    if (!MyUtils.prototype.hasRealJquery()) {
        return false;
    }
    return jqObj ? $(jqObj) : $;
    // return jqObj?jQuery(jqObj):jQuery;
};

//Determine whether it contains real jquery
MyUtils.prototype.hasRealJquery = function (msg) {
    return ('undefined' !== typeof $ && 'undefined' !== typeof jQuery && $ == jQuery) ? true : false;
};

//Capitalize the first letter of the string
MyUtils.prototype.capitalizeFirstLetter = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

//The decimal point is reserved to N digits and is not rounded off
MyUtils.prototype.floatToFixed = function (figure, decimals) {
    // let d = Math.pow(10, decimals);
    // return (parseInt(figure * d) / d).toFixed(decimals);
    let re = new RegExp('^-?\\d+(?:\.\\d{0,' + (decimals || -1) + '})?');
    return figure.toString().match(re)[0];
};

MyUtils.prototype.getCookie = function (name) {
    let cookieValue = null;
    if (document.cookie && document.cookie != '') {
        let cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

MyUtils.prototype.csrfSafeMethod = function (method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
};


MyUtils.prototype.isEmptyObject = function (obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
    // for(let prop in obj) {
    //     if(obj.hasOwnProperty(prop))
    //         return false;
    // }
    // return JSON.stringify(obj) === JSON.stringify({});
};

MyUtils.prototype.getObjectLength = function (obj) {
    return Object.keys(obj).length;
};

MyUtils.prototype.isIframeSupport = function (iframeName) {
    let isOk = null;
    if ('string' == typeof iframeName && iframeName) {
        iframeName = iframeName.trim();
        try {
            if ('object' == typeof window.frames[iframeName]) {
                window.frames[iframeName].window.name;
                isOk = true;
            }
        } catch (e) {
            isOk = false;
        }
    }
    return isOk;
};

/*page redirect*/
MyUtils.prototype.redirectUrl = function (url, iframeName, newTab = false) {
    if (newTab && MyUtils.prototype.getDwsChmExtVersion()) {
        MyUtils.prototype.extExeGlobalJs('chrome.tabs.create({url: "' + url + '"});', () => {
        });
        return;
    }
    let whichWindow = MyUtils.prototype.isIframeSupport(iframeName) ? window.frames[iframeName].window : window;
    whichWindow.location = url;
};

MyUtils.prototype.openNewTab = function (url, newWindow = false, width = 0, height = 0) {
    if (!newWindow) {
        window.open(url, '_blank');
        return;
    }
    let jsCode = 'chrome.windows.create({focused:true';
    width && (jsCode += ',width:' + width);
    height && (jsCode += ',height:' + height);
    jsCode += ',url: "' + url + '"});';
    MyUtils.prototype.extExeGlobalJs(jsCode, () => {
    });
};

MyUtils.prototype.listenEventToContentScript = function (varName, callback) {
    window.addEventListener('message', function (message) {
        alert(JSON.stringify(message));
    });
};


MyUtils.prototype.decodeFromUrlGet = function (url, encoding, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    // Using 'arraybuffer' as the responseType ensures that the raw data is returned,
    // rather than letting XMLHttpRequest decode the data first.
    xhr.responseType = 'arraybuffer';
    xhr.onload = function () {//Note that the ()=> pattern cannot be used here, because the this in the inner layer needs to execute the js caller
        if (200 === this.status) {
            //Scenario 1: Success
            // The decode() method takes a DataView as a parameter, which is a wrapper on top of the ArrayBuffer.
            let dataView = new DataView(this.response);
            // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
            let decoder = new TextDecoder(encoding);
            let decodedString = decoder.decode(dataView);//or let decodedString = decoder.decode(this.response);
            // console.log(decodedString);
            //Scenario 2: Success
            // let test = iconv.decode(this.response,encoding );
            // let test = iconv.decode(Buffer.from(this.response), 'gb2312');
            // console.log(test);
            callback(decodedString);
        } else {
            // console.log('Error while requesting:' + url + this.status);
            callback('Error while requesting:' + url + ':' + this.status);
        }
    };
    xhr.send();
};


MyUtils.prototype.extGetGlobalVar = function (varName, callback) {
    //The callback function is converted to a string and passed as a parameter
    window.postMessage({
        type: 'FROM_PAGE',
        funcName: 'getGlobalVar',
        varName: varName,
        callback: encodeURI(callback.toString())
    }, '*');
};

MyUtils.prototype.extSetGlobalVar = function (varName, varValue) {
    window.postMessage({type: 'FROM_PAGE', funcName: 'setGlobalVar', varName: varName, varValue: varValue}, '*');
};

MyUtils.prototype.extExeGlobalJs = function (jsStr, callback, debug) {
    //The callback function is converted to a string and passed as a parameter, note: callback is executed in the bg scope
    let sender = (top == self ? window : parent);
    'function' == typeof callback ?
        sender.postMessage({
            type: 'FROM_PAGE',
            funcName: 'nothing',
            varName: 'jsCode',
            varValue: jsStr,
            callback: encodeURI(callback.toString()),
            debug: debug
        }, '*') :
        sender.postMessage({
            type: 'FROM_PAGE',
            funcName: 'nothing',
            varName: 'jsCode',
            varValue: jsStr,
            debug: debug
        }, '*');
};

MyUtils.prototype.getDwsChmExtVersion = function () {
    if ('undefined' != typeof glbDwsChmExtVersion) {
        return glbDwsChmExtVersion;
    }
    let dwsChmExtVersion = MyUtils.prototype.getJQuery('html').attr('dwsVersion');
    dwsChmExtVersion = dwsChmExtVersion ? dwsChmExtVersion : '';
    if (dwsChmExtVersion) {
        glbDwsChmExtVersion = dwsChmExtVersion;
    }
    return dwsChmExtVersion;
};

MyUtils.prototype.checkDwsChmExtRunInBg = function () {
    return (-1 !== window.location.href.indexOf('chrome-extension://') ? true : false);
};

MyUtils.prototype.getXMLHttp = function () {
    try {
        return XPCNativeWrapper(new window.wrappedJSObject.XMLHttpRequest());
    } catch (evt) {
        return new XMLHttpRequest();
    }
};

MyUtils.prototype.convToTargetFullUrl = function (urlPath = '') {
    if (!urlPath) {
        // return MyUtils.prototype.getTargetFullHost();
        return '';
    }
    if (urlPath.startsWith('http')) {
        return urlPath;
    }
    //special deal
    if (-1 !== urlPath.indexOf('url(')) {
        urlPath = urlPath.replace(/[\s\S]*url\("/, '').replace(/[\);]+/, '');
        // console.log(urlPath.replace(/[\s\S]*url\(/,'').replace(/[\);]+/,''));
    }
    //Automatically correct and add host prefix
    if (urlPath.startsWith('//')) {
        return window.location.protocol + urlPath;
    }
    return MyUtils.prototype.getTargetFullHost() + urlPath;
};


MyUtils.prototype.getFloatValue = function (value, toFixedNum = 9, returnFalseIfNot = false) {
    let newValue = ('' + value).trim().replace(',', '').replace(' ', '');
    let matchRet = newValue.match(/(\d+(\.\d+)?)/g);
    if (!matchRet) {
        // myUtils.log('warning, float value not extracted!');
        return returnFalseIfNot ? false : 0;
    }
    newValue = matchRet[0];
    newValue = parseFloat(newValue).toFixed(toFixedNum);
    return newValue;
};

MyUtils.prototype.getFloatBits = function (value, returnFalseIfNot = false) {
    let valueBits = returnFalseIfNot ? false : 0;
    if (value && -1 !== value.indexOf('.')) {
        valueBits = value.substr(value.indexOf('.') + 1).length;
    }
    //myUtils.log('debugging:jqStr:' + jqStr + ',value:' + newValue + ',decimal places:' + valueBits);
    return valueBits;
};

MyUtils.prototype.getFloatValueByJqStr = function (jqStr, toFixedNum = 9, returnFalseIfNot = false) {
    return MyUtils.prototype.getFloatValue(MyUtils.prototype.jqHelpFind(jqStr) ? MyUtils.prototype.jqHelpFind(jqStr).text() : MyUtils.prototype.jqHelpFind(jqStr).val(), toFixedNum, returnFalseIfNot);
};

MyUtils.prototype.getFloatBitsByJqStr = function (jqStr, returnFalseIfNot = false) {
    let value = MyUtils.prototype.jqHelpFind(jqStr) ? MyUtils.prototype.jqHelpFind(jqStr).text() : MyUtils.prototype.jqHelpFind(jqStr).val();
    let newValue = ('' + value).trim().replace(',', '').replace(' ', '');
    let matchRet = newValue.match(/(\d+(\.\d+)?)/g);
    if (!matchRet) {
        //MyUtils.prototype.log('warning, float value not extracted!');
        return returnFalseIfNot ? false : 0;
    }
    return MyUtils.prototype.getFloatBits(matchRet[0], returnFalseIfNot);
};

/*send http get by bg,resolve cross-domain problems*/
MyUtils.prototype.bgHttpGet = function get(url, data, callback, async = true) {
    if (MyUtils.prototype.getDwsChmExtVersion()) {
        let jsCode = `ajaxUtil.get("${url}", ${data}, ${callback}, ${async})`;
        MyUtils.prototype.extExeGlobalJs(jsCode, () => {
        });
        return true;
    }
    callback("error:target chrome extension not installed");
    return false;
};

/*send http get by bg,resolve cross-domain problems*/
MyUtils.prototype.bgHttpPost = function get(url, data, callback, async = true) {
    if (MyUtils.prototype.getDwsChmExtVersion()) {
        let jsCode = `ajaxUtil.post("${url}", ${data}, ${callback}, ${async})`;
        MyUtils.prototype.extExeGlobalJs(jsCode, () => {
        });
        return true;
    }
    callback("error:target chrome extension not installed");
    return false;
};

MyUtils.prototype.downloadCsvFromArray = async function (arrItems, fileName, arrHeaders = [], mimeType = 'text/csv;charset=utf-8;') {
    //check arrItems not empty
    if (arrItems.length < 1) {
        return false;
    }
    //auto parse arrHeaders
    if (arrHeaders.length < 1) {
        for (let key in arrItems[0]) {
            arrHeaders.push(key);
        }
    }
    //check auto import json2csv lib
    if ('undefined' == typeof json2csv) {
        MyUtils.prototype.dynExecuteJsbyUrl("https://cdn.jsdelivr.net/npm/json2csv", false);
        await MyUtils.prototype.sleepSyncPromise(3000);
    }
    const xmlParser = new json2csv.Parser({fields: arrHeaders});
    const csvDataStr = xmlParser.parse(arrItems);
    //download csv file
    let eleA = document.createElement('a');
    mimeType = mimeType || 'application/octet-stream';//'text/csv;charset=utf-8;'
    if (navigator.msSaveBlob) { // IE10
        navigator.msSaveBlob(new Blob([csvDataStr], {
            type: mimeType
        }), fileName);
    } else if (URL && 'download' in eleA) { //html5 A[download]
        eleA.href = URL.createObjectURL(new Blob([csvDataStr], {
            type: mimeType
        }));
        eleA.setAttribute('download', fileName);
        document.body.appendChild(eleA);
        eleA.click();
        document.body.removeChild(eleA);
    } else {
        location.href = 'data:application/octet-stream,' + encodeURIComponent(csvDataStr); // only this mime type is supported
    }
};

MyUtils.prototype.hasNestedField = function (obj, key) {
    return key.split(".").every(function (x) {
        if (typeof obj != "object" || obj === null || !x in obj) {
            return false;
        }
        obj = obj[x];
        return true;
    });
};

MyUtils.prototype.getNestedField = function (obj, key) {
    return key.split(".").reduce(function (o, x) {
        return (typeof o == "undefined" || o === null) ? o : o[x];
    }, obj);
};

MyUtils.prototype.deepKeys = function (obj, stack = [], intermediate = false, parent = null) {
    Object.keys(obj).forEach(function (el) {
        // Escape . in the element name
        let escaped = el.replace(/\./g, '\\\.');
        // If it's a nested object
        if ((obj[el] !== null && typeof obj[el] === 'object' && !(obj[el] instanceof Date)) && !Array.isArray(obj[el])) {
            // Concatenate the new parent if exist
            let p = parent ? parent + '.' + escaped : parent;
            // Push intermediate parent key if flag is true
            if (intermediate) stack.push(parent ? p : escaped);
            MyUtils.prototype.deepKeys(obj[el], stack, p || escaped, intermediate);
        } else {
            // Create and save the key
            let key = parent ? parent + '.' + escaped : escaped;
            stack.push(key)
        }
    });
    return stack;
}

MyUtils.prototype.deepSameKeys = function (o1, o2) {
    // Both nulls = same
    if (o1 === null && o2 === null) {
        return true;
    }

    // Get the keys of each object
    const o1keys = o1 === null ? new Set() : new Set(Object.keys(o1));
    const o2keys = o2 === null ? new Set() : new Set(Object.keys(o2));
    if (o1keys.size !== o2keys.size) {
        // Different number of own properties = not the same
        return false;
    }

    // Look for differences, recursing as necessary
    for (const key of o1keys) {
        if (!o2keys.has(key)) {
            // Different keys
            return false;
        }

        // Get the values and their types
        const v1 = o1[key];
        const v2 = o2[key];
        const t1 = typeof v1;
        const t2 = typeof v2;
        if (t1 === "object") {
            if (t2 === "object" && !deepSameKeys(v1, v2)) {
                return false;
            }
        } else if (t2 === "object") {
            //if (t1 === "object" && !deepSameKeys(v1, v2)) {
            //        return false;
            //}
            // We know `v1` isn't an object
            return false;
        }
    }
    // No differences found
    return true;
};

/*Create a tool class object*/
//Note: Using the let scope will make the myUtils variable unavailable to the console console
var myUtils = new MyUtils();