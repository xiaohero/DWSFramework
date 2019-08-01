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

MyUtils.prototype.checkDwsChmExtRunInBg = function () {
    return (-1 !== window.location.href.indexOf('chrome-extension://') ? true : false);
};

//自定义日志函数,支持换行符,主要用于输出服务器日志
MyUtils.prototype.logTopPage = function (msg, fontColor) {
    //完整版功能
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

/*创建工具类对象*/
//注意:使用let作用域会导致console控制台无法使用myUtils变量
var myUtils = new MyUtils();