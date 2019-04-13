/**DWS chrome通用插件: 前台**/
class DwsChmExtFt extends BaseChmExtFt{
    constructor(runModel) {
        super();
        this.runModel=runModel?runModel:'common';//'common','faster'
        this.init();
    }

    init() {
        //插件模式下,iframe上层主页面无需植入代码
        this.removeIframeJsLimit();
        'common'==this.runModel?this.enterGame():this.enterGameFasterModel();
    }

    removeIframeJsLimit() {
        if (top != self) {
            var el = document.createElement('script');
            el.textContent = "if (top !== self) {window.self = window.top;console.log('try to enable iframe nested...');}";
            // el.textContent = 'if (top !== self) {window.top = window.self;}';
            document.documentElement.appendChild(el);
            return;//fixme:下面代码可能还需继续执行
        }
    }

   isPageSkipInject(targetUrl){
        // if(targetUrl&&'string'==typeof targetUrl){
        //     return -1 !== targetUrl.indexOf('DJSPZ/')?true:false;
        // }
        // return -1 !== window.location.href.indexOf('DJSPZ/')?true:0;
       return false;
    }

    enterGameFasterModel(){
       this.invokeGlobalJs('dwsChmExtBg.getBgWebSocket().getEnterJs("'+window.location.href+'",1)', (result) => {
           // console.log('请求结果bg:' + result);
       });
    }


    enterGame() {
        if (this.isPageSkipInject()) {
            console.log('插件模式下，当前页面不注入执行代码:' + window.location.href);
            //删除主页面重复元素
            let tmpEle1 = document.getElementsByClassName('dwsLine1');
            let tmpEle2 = document.getElementsByClassName('dwsLine2');
            let tmpEle3 = document.getElementsByClassName('dwsLine3_inner');
            let tmpEle4 = document.getElementsByClassName('dwsBr');
            tmpEle1.length>0 ? tmpEle1[0].parentNode.removeChild(tmpEle1[0]) : false;
            tmpEle2.length>0 ? tmpEle2[0].parentNode.removeChild(tmpEle2[0]) : false;
            tmpEle3.length>0 ? tmpEle3[0].parentNode.removeChild(tmpEle3[0]) : false;
            tmpEle4.length>0 ? tmpEle4[0].parentNode.removeChild(tmpEle4[0]) : false;
            return;
        }
        this.invokeGlobalJs('dwsChmExtBg.getCurServUrl()', (servUrl) => {
            let errTxt = '';
            if ('' == servUrl) {
                errTxt = '当前服务器尚未开放,请点击右上角插件菜单选择其他服务器';
                console.log(errTxt);
                return;
            }
            if ('0' == servUrl) {
                errTxt = '已停止服务';
                console.log(errTxt);
                return;
            }
            let gameEnterUrl = servUrl + '/DJXNB/Res/checkWsEnterGame?byChmExt=1&url=' + encodeURIComponent(window.location.href);
            console.log('进入系统地址:' + gameEnterUrl);
            //为避免gameEnterUrl前台页面中http,https混淆调用，这里的ajax请求走后端
            if ('object' == typeof ajaxUtil) {
                ajaxUtil.get(gameEnterUrl, {}, function (result) {
                    // console.log('请求结果ft:' + result);
                    window.eval(result);
                }, false);
                return;
            }
            //后端同步请求(注意这里this作用域变了，不能通过this调用invokeGlobalJs)
            dwsChmExtFt.invokeGlobalJs('dwsChmExtBg.ajaxGetSync("' + gameEnterUrl + '")', (result) => {
                // console.log('请求结果bg:' + result);
                window.eval(result);
            });

        });
    }
};