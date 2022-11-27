# DWSFramework (一个通用的基于django+websocket的web框架)

#### 介绍
* DWSFramework是一个通用的基于django+websocket的web框架,代码按照java的OOP风格编写(方便好用).
 * 此框架是基于django封装,集成了websocket支持,常用来搭配谷歌浏览器扩展框架[DWSClient客户端](https://github.com/xiaohero/DWSFramework)使用.
 * 集成并加强了谷歌浏览器的前端js功能，包括如下:
   * 支持websocket实时通信，https转换为http，禁用服务器端iframe保护.
   * 支持前端后台消息转发,后台全局变量存取.
   * 支持http request,http response head,body等截取,还集成了常用第三方js库:如jquery,babel,react,vue等.
   * 支持js代码保护(高强度加密混淆).
   * 如需获取离线版版,不依赖[DWSFramework服务器端](https://github.com/xiaohero/DWSFramework),请联系作者(QQ:2130622841)
   * 如需商业用途请咨询开发作者(QQ:2130622841)
 * 同时还封装了django的http与websocket服务接口,集成了django的管理后台,可通过api接口推送js给前端浏览器执行.


#### 软件架构及原理
* DWSClient运行原理是在启动时候，从服务器[DWSFramework](https://github.com/xiaohero/DWSFramework)获取核心js(代码经过高强度加密与混淆,保护插件代码的安全性)来执行.
* DWSClient启动后,可在菜单里选择服务器地址,然后从服务器拉取最新的js核心代码，前端浏览器通过eval函数执行拉取的js代码。
* DWSClient与服务器保持websocket实时通信，服务器可以实时推送js让前端浏览器执行.同时支持暴露api给第三方网站调用background js.
* 支持支持https转http，支持去服务端iframe保护，支持http request,http response head,body等截取。


#### 安装及使用教程
* 1. 将整个项目拷到你的工程根目录下
* 2. 进入DWSFramework，安装所需依赖:pip3 install -r requirements_version_xx.txt
* 3. django配置文件中加入属性: PROJECT_NAME='xxx',然后就可以使用了
