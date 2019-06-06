/**工具类**/
function MyUtils() {
};

/*日志工具*/
MyUtils.prototype.log = function (str, notLogToTopPage) {
    if (!str) {
        return;
    }
    let curDate = MyUtils.prototype.formatDate((new Date()), 'yyyy-MM-dd hh:mm:ss');
    let tmpStr = MyUtils.prototype.checkDwsChmExtRunInBg() ? '后台:' : '前台:';
    // if('前台:'==tmpStr){//测试调试用代码
    //     return;
    // }
    console.log(curDate + '-->' + tmpStr + str);
    //日志输出到页面
    if (!notLogToTopPage) {
        MyUtils.prototype.logTopPage(str);
    }
};

MyUtils.prototype.dir = function (obj) {
    let curDate = MyUtils.prototype.formatDate((new Date()), 'yyyy-MM-dd hh:mm:ss');
    console.log(curDate + '----object--info---');
    console.dir(obj);
};

/*格式化日期:例子:formatDate((new Date()),'yyyy-M-d hh:mm:ss')*/
MyUtils.prototype.formatDate = function (date, format) {
    let paddNum = function (num) {
        num += '';
        return num.replace(/^(\d)$/, '0$1');
    };
    /*指定格式字符*/
    let cfg = {
        yyyy: date.getFullYear() /*年 : 4位*/
        , yy: date.getFullYear().toString().substring(2)/*年 : 2位*/
        , M: date.getMonth() + 1  /*月 : 如果1位的时候不补0*/
        , MM: paddNum(date.getMonth() + 1) /*月 : 如果1位的时候补0*/
        , d: date.getDate()   /*日 : 如果1位的时候不补0*/
        , dd: paddNum(date.getDate())/*日 : 如果1位的时候补0*/
        , hh: date.getHours()  /*时*/
        , mm: date.getMinutes() /*分*/
        , ss: date.getSeconds() /*秒*/
    };
    format || (format = 'yyyy-MM-dd hh:mm:ss');
    return format.replace(/([a-z])(\1)*/ig, function (m) {
        return cfg[m];
    });
};

/*格式化CST日期的字串*/
MyUtils.prototype.formatCSTDate = function (strDate, format) {
    return MyUtils.prototype.formatDate(new Date(strDate), format);
};

/*加法函数*/
MyUtils.prototype.accAdd = function (arg1, arg2) {
    if ('object' === typeof math && 'function' === typeof math.add) {
        return math.add(arg1, arg2);
    }
    let r1, r2, m;
    try {
        r1 = arg1.toString().split(".")[1].length;
    }
    catch (e) {
        r1 = 0;
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    }
    catch (e) {
        r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    return (arg1 * m + arg2 * m) / m;
};

/*减法函数*/
MyUtils.prototype.accSub = function (arg1, arg2) {
    if ('object' === typeof math && 'function' === typeof math.subtract) {
        return math.subtract(arg1, arg2);
    }
    let r1, r2, m, n;
    try {
        r1 = arg1.toString().split(".")[1].length;
    }
    catch (e) {
        r1 = 0;
    }
    try {
        r2 = arg2.toString().split(".")[1].length;
    }
    catch (e) {
        r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    /*last modify by deeka
     动态控制精度长度*/
    n = (r1 >= r2) ? r1 : r2;
    return ((arg1 * m - arg2 * m) / m).toFixed(n);
};

/*乘法函数*/
MyUtils.prototype.accMul = function (arg1, arg2) {
    if ('object' === typeof math && 'function' === typeof math.multiply) {
        return math.multiply(arg1, arg2);
    }
    MyUtils.prototype.log('警告:未引入math.js库，浮点型乘法计算可能存在误差!');
    return arg1 * arg2;
    //下面网上流传的乘法函数有bug
    let m = 0, s1 = arg1.toString(), s2 = arg2.toString();
    try {
        m += s1.split(".")[1].length;
    }
    catch (e) {
    }
    try {
        m += s2.split(".")[1].length;
    }
    catch (e) {
    }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, m);
};

/*除法函数*/
MyUtils.prototype.accDiv = function (arg1, arg2) {
    if ('object' === typeof math && 'function' === typeof math.divide) {
        return math.divide(arg1, arg2);
    }
    let t1 = 0, t2 = 0, r1, r2;
    try {
        t1 = arg1.toString().split(".")[1].length;
    }
    catch (e) {
    }
    try {
        t2 = arg2.toString().split(".")[1].length;
    }
    catch (e) {
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


/*等待某元素出现(可见)*/
MyUtils.prototype.waitForElementVisible = function (jqStrElement, callbackFunc, msTimeout) {
    msTimeout = parseInt(msTimeout) > 0 ? parseInt(msTimeout) : 30000;
    let tmpTimerCount = 0;
    let tmpTimerCheckGapMs = 10;
    let tmpTimer = setInterval(() => {
        if (++tmpTimerCount * tmpTimerCheckGapMs > msTimeout) {
            // MyUtils.prototype.log('未检测到可见元素:' + jqStrElement + '(检测超时)!');
            clearInterval(tmpTimer);
            callbackFunc(false);
            return;
        }
        let jqFindObj = MyUtils.prototype.jqHelpFind(jqStrElement);
        if (jqFindObj.length && jqFindObj.is(':visible')) {
            // myUtils.log('检测到可见元素:' + jqStrElement);
            // jqFindObj.click();
            clearInterval(tmpTimer);
            callbackFunc(jqFindObj);
        }
    }, tmpTimerCheckGapMs);
};

/*等待某元素出现(可见)*/
MyUtils.prototype.waitForElementAndClick = function (jqStrElement, clickModel, afterClickLog, notFoundLog, msTimeout, callbackFunc) {
    clickModel = ('event' == clickModel ? clickModel : 'click');
    afterClickLog = afterClickLog ? afterClickLog : '找到(' + jqStrElement + ')元素并点击';
    notFoundLog = notFoundLog ? notFoundLog : '未找到(' + jqStrElement + ')元素(检测超时)';
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


/*已废弃*/
MyUtils.prototype.waitAndPageReloadClick = function (jqStrElement, jqObjIframe, msTimeout, callbackFunc) {
    msTimeout = parseInt(msTimeout) > 0 ? parseInt(msTimeout) : 30;
    let timeCount = 0;
    let tmpTimer = setInterval(function () {
        // MyUtils.prototype.log('页面是否重新加载:'+window.performance.navigation.type);
        timeCount += 1;
        if (timeCount > msTimeout) {
            MyUtils.prototype.log('未发现:' + jqStrElement + '元素，请按F5刷新页面!');
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
            // MyUtils.prototype.log('点击次数：'+timeCount);
        }
    }, 10);
    //检测点击事件是否已经造成页面刷新
    MyUtils.prototype.beforeIframeReload(jqObjIframe, function () {
        MyUtils.prototype.log('检测到页面刷新，点击成功，关闭定时器');
        clearInterval(tmpTimer);
    });
};


/*睡眠N毫秒,同步阻塞进程*/
MyUtils.prototype.sleepSync = async function (ms) {
    for (let t = Date.now(); Date.now() - t <= ms;);
    // (async ()=>{return MyUtils.prototype.log('xxx');await MyUtils.prototype.sleepSyncPromise(5000);})();

};

/*睡眠N毫秒,同步不阻塞进程*/
MyUtils.prototype.sleepSyncPromise = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};


/*睡眠N毫秒,异步*/
MyUtils.prototype.sleepAsync = function (callbackFunc, ms) {
    setTimeout(callbackFunc, ms);
    // (function my_func() {
    //     //正常逻辑代码
    //     //xxxxxxxxx
    //     if(true){
    //         setTimeout(my_func, ms);
    //     }
    // })();
};


/*字符串去所有空格*/
MyUtils.prototype.strTrimAll = function (str) {
    return str.replace(/\s+/g, "");
};

/*字符串获取数字+字母*/
MyUtils.prototype.strGetNumAlpha = function (str) {
    return str.replace(/[^0-9a-zA-Z]+/g, "");
};

/*本地img图片url转base64*/
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
/*本地img图片转base64*/
MyUtils.prototype.imgLabelToBase64 = function (jqStrImg, removeHeader=false) {
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
    //移除添加的canvas
    MyUtils.prototype.jqHelpFind('#myCanvas').remove();
    return returnStr;
};

/*jsonp客户端自定义数据发送服务器*/
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
            console.log('请求成功，返回结果:');
            console.log(JSON.stringify(msg));
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            console.log('请求失败,接口请求错误:' + JSON.stringify(errorThrown));
        }
    });
};

/*jq辅助查找*/
MyUtils.prototype.jqHelpFind = function (jqStr, getText=false) {
    /*特殊支持$分隔后面跟属性名*/
    let jqFieldStr='';
    if (getText && -1 !== jqStr.indexOf('$') && 2 == jqStr.split('$').length) {
        jqStr=jqStr.split('$')[0];
        jqFieldStr=jqStr.split('$')[1];
    }
    let isXpathStr = ('string' == typeof jqStr && jqStr.match(/^\/\//)) ? true : false;
    let funcName = isXpathStr ? 'xpath' : 'find';//同时兼容css和xpath选择器
    /*先搜索自身域*/
    if (MyUtils.prototype.getJQuery(window.document)[funcName](jqStr).length) {
        return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(window.document)[funcName](jqStr).attr(jqFieldStr) : MyUtils.prototype.getJQuery(window.document)[funcName](jqStr).text()) : MyUtils.prototype.getJQuery(window.document)[funcName](jqStr);
    }
    /*搜索子域*/
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
    /*搜索父域*/
    try {
        /*捕获异常，有可能跨域不能访问*/
        if (MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr).length) {
            return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr).attr(jqFieldStr) : MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr).text()) : MyUtils.prototype.getJQuery(window.parent.document)[funcName](jqStr);
        }
    } catch (e) {

    }
    return getText ? '':[];
    // if(!isXpathStr){
    //     /*先搜索自身域*/
    //     if (MyUtils.prototype.getJQuery(window.document).find(jqStr).length) {
    //         return getText ? MyUtils.prototype.getJQuery(window.document).find(jqStr).text() : MyUtils.prototype.getJQuery(window.document).find(jqStr);
    //     }
    //     /*搜索子域*/
    //     if (window.frames.length > 0) {
    //         for (let idx = 0; idx < window.frames.length; idx++) {
    //             if (MyUtils.prototype.getJQuery(window.frames[idx].document).find(jqStr).length) {
    //                 return getText ? MyUtils.prototype.getJQuery(window.frames[idx].document).find(jqStr).text() : MyUtils.prototype.getJQuery(window.frames[idx].document).find(jqStr);
    //             }
    //         }
    //     }
    //     /*搜索父域*/
    //     try {
    //         /*捕获异常，有可能跨域不能访问*/
    //         if (MyUtils.prototype.getJQuery(window.parent.document).find(jqStr).length) {
    //             return getText ? MyUtils.prototype.getJQuery(window.parent.document).find(jqStr).text() : MyUtils.prototype.getJQuery(window.parent.document).find(jqStr);
    //         }
    //     } catch (e) {
    //
    //     }
    // }
};


/*jq辅助查找*/
MyUtils.prototype.jqHelpInnerFind = function (jqTarget,jqStr, getText=false) {
    /*特殊支持$分隔后面跟属性名*/
    let jqFieldStr='';
    if (getText && -1 !== jqStr.indexOf('$') && 2 == jqStr.split('$').length) {
        jqFieldStr=jqStr.split('$')[1];
        jqStr=jqStr.split('$')[0];
    }
    //console.log(jqStr+'=>'+jqStr.split('$').length+',jqStr:'+jqStr+',jqFieldStr:'+jqFieldStr);
    let isXpathStr = ('string' == typeof jqStr && jqStr.match(/^\/\//)) ? true : false;
    let funcName = isXpathStr ? 'xpath' : 'find';//同时兼容css和xpath选择器
    if (MyUtils.prototype.getJQuery(jqTarget).length<1){
        return getText ? '' : [];
    }
    /*自身dom查找*/
    if(!jqStr){
        return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(jqTarget).attr(jqFieldStr) : MyUtils.prototype.getJQuery(jqTarget).text()) : MyUtils.prototype.getJQuery(jqTarget);
    }
    /*搜索自身域*/
    if (MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr).length>0) {
        return getText ? (jqFieldStr ? MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr).attr(jqFieldStr) : MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr).text()) : MyUtils.prototype.getJQuery(jqTarget)[funcName](jqStr);
    }
    return getText ? '':[];
};

/*获取目标window对象变量或函数*/
MyUtils.prototype.winHelpGet = function (winObjOrFunName) {
    /*先搜索自身域*/
    if (window[winObjOrFunName]) {
        return window[winObjOrFunName];
    }
    /*搜索子域*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (window.frames[idx][winObjOrFunName]) {
                return window.frames[idx][winObjOrFunName];
            }
        }
    }
    /*搜索父域*/
    try {
        /*捕获异常，有可能跨域不能访问*/
        if (window.parent[winObjOrFunName]) {
            return window.parent[winObjOrFunName];
        }
    } catch (e) {

    }
    return false;
};

/*设置目标window对象变量或函数值*/
MyUtils.prototype.winHelpSet = function (winObjOrFunName, valueObOrFun) {
    /*先搜索自身域*/
    if (window[winObjOrFunName]) {
        return window[winObjOrFunName] = valueObOrFun;
    }
    /*搜索子域*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (window.frames[idx][winObjOrFunName]) {
                return window.frames[idx][winObjOrFunName] = valueObOrFun;
            }
        }
    }
    /*搜索父域*/
    try {
        /*捕获异常，有可能跨域不能访问*/
        if (window.parent[winObjOrFunName]) {
            return window.parent[winObjOrFunName] = valueObOrFun;
        }
    } catch (e) {

    }
    return false;
};

/*获取顶层网站host*/
MyUtils.prototype.getTopFullHost = function () {
    /*先搜索自身域*/
    let serverFullHost = window.location.protocol + '//' + window.location.host;
    return serverFullHost;
};

/*获取顶层1网站url*/
MyUtils.prototype.getTopCurrentUrl = function () {
    return window.location.href;
};

MyUtils.prototype.topIsServer = function () {
    /*先搜索自身域*/
    let serverFullHost = MyUtils.prototype.getTopFullHost();
    return /\d+.\d+.\d+.\d+/.test(serverFullHost) ? serverFullHost : false;
};

/*获取目标网站host*/
MyUtils.prototype.getTargetHost = function () {
    /*先搜索自身域*/
    if (!/(\d.\d.\d.\d)|(localhost)/.test(window.location.host)) {
        return window.location.host;
    }
    /*搜索子域*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (!/(\d.\d.\d.\d)|(localhost)/.test(window.frames[idx].location.host)) {
                return window.frames[idx].location.host;
            }
        }
    }
    /*搜索父域*/
    try {
        /*捕获异常，有可能跨域不能访问*/
        if (!/(\d.\d.\d.\d)|(localhost)/.test(window.parent.location.host)) {
            return window.parent.location.host;
        }
    } catch (e) {

    }
    return window.location.host;
};

/*获取目标网站host*/
MyUtils.prototype.getTargetFullHost = function () {
    /*先搜索自身域*/
    if (!/(\d.\d.\d.\d)|(localhost)/.test(window.location.host)) {
        return window.location.protocol + '//' + window.location.host;
    }
    /*搜索子域*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (!/(\d.\d.\d.\d)|(localhost)/.test(window.frames[idx].location.host)) {
                return window.frames[idx].location.protocol + '//' + window.frames[idx].location.host;
            }
        }
    }
    /*搜索父域*/
    try {
        /*捕获异常，有可能跨域不能访问*/
        if (!/(\d.\d.\d.\d)|(localhost)/.test(window.parent.location.host)) {
            return window.parent.location.protocol + '//' + window.parent.location.host;
        }
    } catch (e) {

    }
    return window.location.protocol + '//' + window.location.host;

};

/*获取目标网站url全路径*/
MyUtils.prototype.getTargetCurrentUrl = function () {
    /*先搜索自身域*/
    if (!/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|(localhost)/.test(window.location.href)) {
        return window.location.href;
    }
    /*搜索子域*/
    if (window.frames.length > 0) {
        for (let idx = 0; idx < window.frames.length; idx++) {
            if (!/(\d.\d.\d.\d)|(localhost)/.test(window.frames[idx].location.href)) {
                return window.frames[idx].location.href;
            }
        }
    }
    /*搜索父域*/
    try {
        /*捕获异常，有可能跨域不能访问*/
        if (!/(\d.\d.\d.\d)|(localhost)/.test(window.parent.location.href)) {
            return window.parent.location.href;
        }
    } catch (e) {

    }
    return window.location.href;

};

/*关闭当前页面*/
MyUtils.prototype.closeCurrentPage = function () {
    /*关闭当前页面*/
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


/*页面跳转*/
MyUtils.prototype.redirectUrl = function (url, iframeName,newTab=false) {
    if (newTab && MyUtils.prototype.getDwsChmExtVersion()) {
        MyUtils.prototype.extExeGlobalJs('chrome.tabs.create({url: "'+url+'"});',()=>{});
        return;
    }
    let whichWindow = MyUtils.prototype.isIframeSupport(iframeName) ? window.frames[iframeName].window : window;
    whichWindow.location = url;
};

/*页面刷新*/
MyUtils.prototype.reload = function (iframeName) {
    // console.log('页面刷新跳过');return;
    if (!MyUtils.prototype.isIframeSupport(iframeName)) {
        MyUtils.prototype.log('未找到iframe:(' + iframeName + '),直接刷新顶层页面!');
        MyUtils.prototype.extExeGlobalJs('dwsChmExtBg.flushParentWindowByFrameUrl("' + window.location + '")');
        window.location.reload();
        return;
    }
    // if ('undefined' != typeof iframeName && 'undefined'==typeof window.frames[iframeName]) {
    //     MyUtils.prototype.log('未找到iframe:('+iframeName+'),此次页面刷新跳过!');
    //     return;
    // }

    // let whichWindow = iframeName ? window.frames[iframeName].window : window;
    // whichWindow.location.reload();
    window.frames[iframeName].window.reload();
};

/*拦截ajax页面成功消息*/
MyUtils.prototype.afterAjaxSuccess = function (callbackFunc, jqStr) {
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            MyUtils.prototype.log('ajax请求完成...');
            console.dir(arguments);
        }
    }
    jqStr = jqStr ? jqStr : document;
    MyUtils.prototype.getJQuery(jqStr).ajaxSuccess(callbackFunc);
};

/*拦截表单提交成功后消息*/
MyUtils.prototype.afterIframeLoad = function (jqObjIframe, callbackFunc) {
    if (jqObjIframe.length < 1) {
        MyUtils.prototype.log('未找到指定iframe，无法注册load事件...');
        return;
    }
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            MyUtils.prototype.log('iframe加载完成...');
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

/*拦截表单提交成功后消息*/
MyUtils.prototype.beforeIframeReload = function (jqObjIframe, callbackFunc) {
    if (jqObjIframe.length < 1) {
        MyUtils.prototype.log('未找到指定iframe，无法注册beforeunload事件...');
        return;
    }
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            // MyUtils.prototype.log('iframe即将刷新...');
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
        MyUtils.prototype.log('未找到指定iframe，无法注册ready事件...');
        return;
    }
    if ('function' != typeof callbackFunc) {
        callbackFunc = function () {
            MyUtils.prototype.log('iframe加载完成...');
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


/*动态执行Reactjs代码*/
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


/*动态执行Reactjs代码*/
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

/*动态执行Reactjs代码*/
MyUtils.prototype.dynExecuteJsbyUrl = function (url) {
    let script = document.createElement('script');
    // script.id = newReactjsEleId;
    script.type = 'text/javascript';
    script.src = url;
    // script.async = true;
    document.getElementsByTagName('head')[0].appendChild(script);
};

/*获取当前函数名*/
MyUtils.prototype.getCurFuncName = function () {
    let stack = new Error().stack;
    let caller = stack.split('\n')[2].trim();
    caller = caller.replace(/(at )/, '');
    return caller;
};


/*模拟触发js dom事件*/
MyUtils.prototype.eventFire = function (el, etype) {
    if (el.fireEvent) {
        el.fireEvent('on' + etype);
    } else {
        let evObj = document.createEvent('Events');
        evObj.initEvent(etype, true, false);
        el.dispatchEvent(evObj);
    }
};

/*模拟触发js原生click事件*/
MyUtils.prototype.simulateClick = function (el) {
    alert('cls_name:'+MyUtils.prototype.getClsName(el));
    if('object'!==typeof el){
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


/*模拟触发js dom键盘输入事件*/
MyUtils.prototype.simulateKeyPress = function (character) {
    jQuery.event.trigger({type: 'keypress', which: character.charCodeAt(0)});
};

/*模拟触发js dom事件*/
MyUtils.prototype.random = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};


//自定义日志函数,支持换行符,主要用于输出服务器日志
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

//自定义日志函数,支持换行符,主要用于输出服务器日志
MyUtils.prototype.logTopPage = function (msg, fontColor) {
    fontColor = fontColor ? fontColor : 'blueviolet';
    let jqObj = MyUtils.prototype.jqHelpFind('#warnMsg');

    //如果非iframe嵌套，尝试注入日志div
    if (jqObj.length < 1 && MyUtils.prototype.jqHelpFind('body').length) {
        // console.log('尝试注入页面日志div');
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

//获取jQuery全局对象
MyUtils.prototype.getJQuery = function (jqObj='') {
    if(!MyUtils.prototype.hasRealJquery()){
        return false;
    }
    return jqObj?$(jqObj):$;
    // return jqObj?jQuery(jqObj):jQuery;
};

//判断是否含有真实jquery
MyUtils.prototype.hasRealJquery = function (msg) {
    return ('undefined' !== typeof $ && 'undefined' !== typeof jQuery && $ == jQuery) ? true : false;
};

//字符串首字母大写
MyUtils.prototype.capitalizeFirstLetter = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

//小数点保留N位，且不四舍五入
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

MyUtils.prototype.openNewTab = function (url) {
    MyUtils.prototype.getJQuery().ajax({
        url: 'http://www.163.com',
        success: function () {
            window.open(url, '_blank');
        },
        async: false
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
    xhr.onload = function () {//注意这里不能用()=>模式,因为里层要的this就是需要执行js调用者
        if (200 === this.status) {
            //方案1：成功
            // The decode() method takes a DataView as a parameter, which is a wrapper on top of the ArrayBuffer.
            let dataView = new DataView(this.response);
            // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
            let decoder = new TextDecoder(encoding);
            let decodedString = decoder.decode(dataView);//or let decodedString = decoder.decode(this.response);
            // console.log(decodedString);
            //方案2：成功
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
    //回调函数转字符串作为参数传递
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
    //回调函数转字符串作为参数传递,注意:callback是在bg作用域执行的
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
    }
    catch (evt) {
        return new XMLHttpRequest();
    }
};

MyUtils.prototype.convToTargetFullUrl = function (urlPath='') {
    if(!urlPath){
        // return MyUtils.prototype.getTargetFullHost();
        return '';
    }
    if(urlPath.startsWith('http')){
        return urlPath;
    }
    //特殊处理
    if(-1!==urlPath.indexOf('url(')){
        urlPath=urlPath.replace(/[\s\S]*url\("/,'').replace(/[\);]+/,'');
        // console.log(urlPath.replace(/[\s\S]*url\(/,'').replace(/[\);]+/,''));
    }
    //自动修正补加host前缀
    if(urlPath.startsWith('//')){
        return window.location.protocol+urlPath;
    }
    return MyUtils.prototype.getTargetFullHost() + urlPath;
};


MyUtils.prototype.getFloatValue = function (value, toFixedNum = 9) {
    let newValue = ('' + value).trim().replace(',', '').replace(' ', '');
    let matchRet = newValue.match(/(\d+(\.\d+)?)/g);
    if (!matchRet) {
        // myUtils.log('警告，未提取到浮点型数值!');
        return 0;
    }
    newValue = matchRet[0];
    newValue = parseFloat(newValue).toFixed(toFixedNum);
    return newValue;
};

MyUtils.prototype.getFloatBits = function (value) {
    let valueBits = 0;
    if (-1 !== value.indexOf('.')) {
        valueBits = value.substr(value.indexOf('.') + 1).length;
    }
    //myUtils.log('调试:jqStr:' + jqStr + ',值:' + newValue + ',小数位数:' + valueBits);
    return valueBits;
};

MyUtils.prototype.getFloatValueByJqStr = function (jqStr, toFixedNum = 9) {
    return MyUtils.prototype.getFloatValue('undefined'!==typeof MyUtils.prototype.jqHelpFind(jqStr).val() ? MyUtils.prototype.jqHelpFind(jqStr).val() : MyUtils.prototype.jqHelpFind(jqStr).text(), toFixedNum);
};

MyUtils.prototype.getFloatBitsByJqStr = function (jqStr) {
    let value = 'undefined'!==typeof MyUtils.prototype.jqHelpFind(jqStr).val() ? MyUtils.prototype.jqHelpFind(jqStr).val() : MyUtils.prototype.jqHelpFind(jqStr).text();
    let newValue = ('' + value).trim().replace(',', '').replace(' ', '');
    let matchRet = newValue.match(/(\d+(\.\d+)?)/g);
    if (!matchRet) {
        //MyUtils.prototype.log('警告，未提取到浮点型数值!');
        return 0;
    }
    return MyUtils.prototype.getFloatBits(matchRet[0]);
};



/*创建工具类对象*/
//注意:使用let作用域会导致console控制台无法使用myUtils变量
var myUtils = new MyUtils();