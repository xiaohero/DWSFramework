# DWSFramework ([English introduction](https://github.com/xiaohero/DWSFramework/blob/master/README.en.md)) (a general web framework based on django+websocket)

#### introduce
* DWSFramework is a general web framework based on django+websocket, the code is written in the OOP style of java (convenient and easy to use).
 * This framework is based on django package, integrates websocket support, and is often used with Google Chrome extension framework [DWSClient client] (https://github.com/xiaohero/DWSFramework).
 * Integrate and enhance the front-end js functions of Google Chrome, including the following:
   * Support websocket real-time communication, convert https to http, disable server-side iframe protection.
   * Support front-end and back-end message forwarding, back-end global variable access.
   * Supports interception of http request, http response head, body, etc., and also integrates common third-party js libraries: such as jquery, babel, react, vue, etc.
   * Support js code protection (high-strength encryption obfuscation).
   * If you want to get the offline version without relying on the [DWSFramework server side](https://github.com/xiaohero/DWSFramework), please contact the author (QQ: 2130622841)
   * For commercial use, please consult the developer (QQ: 2130622841)
 * At the same time, it also encapsulates django's http and websocket service interfaces, integrates django's management background, and can push js to front-end browsers for execution through the api interface.


#### Software Architecture and Principles
* The operating principle of DWSClient is to obtain the core js (the code is encrypted and obfuscated with high strength to protect the security of the plug-in code) from the server [DWSFramework](https://github.com/xiaohero/DWSFramework) to execute.
* After the DWSClient is started, you can select the server address in the menu, and then pull the latest js core code from the server, and the front-end browser executes the pulled js code through the eval function.
* DWSClient maintains websocket real-time communication with the server, and the server can push js in real time for the front-end browser to execute. At the same time, it supports exposing api to third-party websites to call background js.
* Support to support https to http, support iframe protection to the server, support http request, http response head, body and other interception.


#### Installation and usage tutorial
* 1. Copy the entire project to your project root directory
* 2. Enter DWSFramework and install the required dependencies: pip3 install -r requirements_version_xx.txt
* 3. Add the attribute to the django configuration file: PROJECT_NAME='xxx', then you can use it
