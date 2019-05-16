/* javascript-obfuscator:disable */
/**DWS chrome通用插件: 前台**/
class DwsChmExtFt extends BaseChmExtFt{
    constructor() {
        super();
        this.init();
    }

    init() {
        //插件模式下,iframe上层主页面无需植入代码
        this.removeIframeJsLimit();
        this.enterGame();
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

    enterGame(){
       this.invokeGlobalJs('dwsChmExtBg.getBgWebSocket().getEnterJs("'+window.location.href+'",1)', (result) => {
           // console.log('请求结果bg:' + result);
       });
    }
}
/* javascript-obfuscator:enable */