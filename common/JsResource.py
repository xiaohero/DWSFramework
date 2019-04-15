'''
Created on Jul 1, 2017

@author: xiaoxi
'''

from ..util.MyUtil import MyUtil


class JsResource:

    '''
    静态资源访问类
    '''

    def __init__(self):
        '''
        构造函数
        '''

    # 根据平台代码,获取基础js资源
    #
    @classmethod
    def getChmExtJsContents(cls, version='latest', secKey=''):
        # todo: 1.后期根据version获取指定版本的js
        # todo: 2.后期根据secKey及过期时间控制js获取
        jsFileBaseChmExtBg = '{}/js/chm-ext/base/BaseChmExtBg.js'.format(MyUtil.getDWSClientDir())
        jsFileBaseChmExtFt = '{}/js/chm-ext/base/BaseChmExtFt.js'.format(MyUtil.getDWSClientDir())
        jsFileDwsChmBbExt = '{}/js/chm-ext/DwsChmExtBg.js'.format(MyUtil.getDWSClientDir())
        jsFileDwsChmFtExt = '{}/js/chm-ext/DwsChmExtFt.js'.format(MyUtil.getDWSClientDir())
        jsFileWebSocket = '{}/js/chm-ext/DwsWebSocket.js'.format(MyUtil.getDWSClientDir())
        fileContent = MyUtil.readFileToStr(jsFileBaseChmExtBg, True)+MyUtil.readFileToStr(jsFileBaseChmExtFt, True)
        fileContent += MyUtil.readFileToStr(jsFileWebSocket, True)#提到前面引入
        fileContent += MyUtil.readFileToStr(jsFileDwsChmBbExt, True)
        fileContent += MyUtil.readFileToStr(jsFileDwsChmFtExt, True)
        return fileContent

    #获取基础js资源
    @classmethod
    def getBaseJsContents(cls, needJquery=0, needJqueryXpath=0, needReact=0, needVue=0, needJqueryCookie=1):
        fileContent = ''
        # fixme:正式上线后，如若js不再更改，可开启读文件缓存
        jsFileJquery = '{}/js/third-party/jquery/3.2.1/jquery.js'.format(MyUtil.getDWSClientDir())
        jsFileJqueryXPath = '{}/js/third-party/jquery-xpath/0.3.1/jquery.xpath.min.js'.format(MyUtil.getDWSClientDir())
        jsFileJqueryCookie = '{}/js/third-party/jquery-cookie/1.4.1/jquery.cookie.min.js'.format(MyUtil.getDWSClientDir())
        jsFileReact = '{}/js/third-party/react/15.6.1/react.js'.format(MyUtil.getDWSClientDir())
        jsFileReactDom = '{}/js/third-party/react/15.6.1/react-dom.js'.format(MyUtil.getDWSClientDir())
        jsFileVue = '{}/js/third-party/vue/2.3.4/vue.js'.format(MyUtil.getDWSClientDir())
        # jsFileBabel = '{}/js/third-party/babel-standalone/6.25.0/babel.js'.format(MyUtil.getDWSClientDir())
        # babel-polyfill，用于支持babel中的async,await
        # jsFileBabelPolyfill = '{}/js/third-party/babel-polyfill/7.0.0-alpha.15/polyfill.js'.format(MyUtil.getDWSClientDir())
        # 数学库，为支持浮点型计算
        jsMathJs = '{}/js/third-party/mathjs/3.16.5/math.min.js'.format(MyUtil.getDWSClientDir())
        jsFileMyUil = '{}/js/util/MyUtil.js'.format(MyUtil.getDWSClientDir())
        # jquery相关支持########################
        if needJquery:
            fileContent += MyUtil.readFileToStr(jsFileJquery, True)
        if needJqueryXpath:
            fileContent += MyUtil.readFileToStr(jsFileJqueryXPath, True)
        if needJqueryCookie:
            fileContent += MyUtil.readFileToStr(jsFileJqueryCookie, True)
        # react支持########################
        if needReact:
            fileContent += MyUtil.readFileToStr(jsFileReact, True)
            fileContent += MyUtil.readFileToStr(jsFileReactDom, True)
        # vue支持########################
        if needVue:
            fileContent += MyUtil.readFileToStr(jsFileVue, True)
        # 其它相关支持########################
        # fileContent+=MyUtil.readFileToStr(jsFileBabel,True)#因为ide文件监听已经转换了ES6代码，所以客户端无需再引入了babel了
        # fileContent+=MyUtil.readFileToStr(jsFileBabelPolyfill,True)#babel转换过程去掉env参数后就不会转换ES5语法，新版chrome默认支持ES6

        # 工具类,必须放到jquery后面
        fileContent += MyUtil.readFileToStr(jsMathJs, True)
        fileContent += MyUtil.readFileToStr(jsFileMyUil, True)
        return fileContent

    # 根据平台代码,获取逻辑js资源
    @classmethod
    def getDefaultClientJsContents(cls, siteCode, needJquery=0):
        fileContent=''
        # 默认业务类路径
        jsFileLogicClient = '{}/js/logic/{}/ClientService.js'.format(MyUtil.getProjectStaticDir(),siteCode)
        if MyUtil.isFilePathExisted(jsFileLogicClient):
            # 载入框架基础js库
            fileContent += cls.getBaseJsContents(needJquery)
            # 载入客户端基础业务类
            jsFileLogicBase = '{}/js/logic/base/BaseClientService.js'.format(MyUtil.getDWSClientDir())
            fileContent += MyUtil.readFileToStr(jsFileLogicBase, True).replace(
                'class BaseClientService', 'var BaseClientService=class BaseClientService'
            )
            # 载入客户端实际业务类(todo: 下面delete语句可能需要去掉,以免引起clientService先前生命周期丢失)
            fileContent += ';delete clientService;' + MyUtil.readFileToStr(jsFileLogicClient, True).replace(
                'class ClientService', 'var ClientService=class ClientService'
            )
            # 启动客户端程序
            fileContent += ';clientService=new ClientService();clientService.run();'
        else:
            MyUtil.logInfo('默认业务js类路径文件({})未找到，请自行实现客户端业务类js查找并返回!'.format(jsFileLogicClient))
        return fileContent