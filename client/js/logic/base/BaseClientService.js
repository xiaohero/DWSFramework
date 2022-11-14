class BaseClientService {
    //Constructor
    constructor() {
        //myUtils.log('Enter BaseClientService Constructor');
        if (this.constructor === BaseClientService) {
            // Error Type 1. Abstract class can not be constructed.
            throw new TypeError('Can not construct abstract class.');
        }
        if (this.run === BaseClientService.prototype.run) {
            // Error Type 4. Child has not implemented this abstract method.
            throw new TypeError('Please implement abstract method run.');
        }
    }

    //Entry program, subclasses need to implement this method
    run() {
        console.log('warning:client should implement this abstract method!');
    }

    wsSendMessage(sendData) {
        // console.log('ready to send a message to the server:'+JSON.stringify(sendData));
        if (!sendData) {
            return false;
        }
        if (!myUtils.getDwsChmExtVersion()) {
            // alert('Sending error, please install DWS Google plugin first!');
            return false;
        }
        let bgJsCode = 'dwsChmExtBg.getWebSocket().sendMessage(' + JSON.stringify(sendData) + ')';
        myUtils.extExeGlobalJs(bgJsCode, result => {});
    }

    //Check if the user is online on the platform
    checkUserlogged() {
        return false;
    }

    //Get the unique uuid of the current page
    getCurPageUUID() {
        return '';
    }
}
