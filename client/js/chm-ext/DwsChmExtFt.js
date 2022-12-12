/* javascript-obfuscator:disable */
/**DWS chrome universal extension: front desk**/
class DwsChmExtFt extends BaseChmExtFt{
    constructor() {
        super();
        this.init();
    }

    init() {
        //In extension mode, the main page above the iframe does not need to implant code
        this.removeIframeJsLimit();
        this.enterGame();
    }

    removeIframeJsLimit() {
        if (top != self) {
            var el = document.createElement('script');
            el.textContent = "if (top !== self) {window.self = window.top;console.log('try to enable iframe nested...');}";
            // el.textContent = 'if (top !== self) {window.top = window.self;}';
            document.documentElement.appendChild(el);
            return;//fixme:The following code may still need to be executed
        }
    }

    enterGame() {
        this.invokeGlobalJs('dwsChmExtBg.bgEnterGame("' + window.location.href + '")', (result) => {
            // console.log('bg request result:' + result);
        });
        //this.invokeGlobalJs('dwsChmExtBg.getBgWebSocket() && dwsChmExtBg.getBgWebSocket().getEnterJs("' + window.location.href + '",1)', (result) => {
        //    // console.log('bg request result:' + result);
        //});
    }
}
/* javascript-obfuscator:enable */