'''
Created on Jul 1, 2017

@author: xiaoxi
'''
from websocket.UniversalWebsocket import UniversalWebsocket
from util.MyUtil import MyUtil
import json
from builtins import isinstance
from django.utils.decorators import method_decorator
from annotation.AnnoUser import AnnoUser

class MainAction(UniversalWebsocket):
    '''
    websocket主类
    '''


    #开启登录拦截
    wsLoginRequired=True
    
    def __init__(self, message):
        '''
        构造函数
        '''
        # MyUtil.logInfo('进入MainXNB构造函数!')
        #记住这里要调用父类构造函数
        super().__init__(message)


    def receive(self, text=None, bytes=None, **kwargs):
        """
        处理ws_message消息，自定义逻辑
        """
        MyUtil.logDebug('客户端({}) username:({}) 发来消息:{}'.format(self.message.reply_channel,self.message.user.username, self.message.content['text']))
        clientData=json.loads(text)
        if not (isinstance(clientData,dict) and 'clsName' in clientData and 'op' in clientData and 'host' in clientData and 'data' in clientData and isinstance(clientData['data'],str)):
            self.sendErrMsgToCurUser('格式错误，非法请求，请不要恶意攻击!')
            return
        #判断服务类是否存在
        serviceHandleCls=MyUtil.getClassByStrName(MyUtil.getProjectName()+'.service.xnb.'+clientData['clsName'],clientData['clsName'])
        if not serviceHandleCls:
            self.sendErrMsgToCurUser('无效业务，请不要恶意攻击!')
            return
        serviceHandleObj=serviceHandleCls(**clientData)
        #判断业务方法是否存在
        serviceHandleMethod=MyUtil.getClassMethodByStrName(serviceHandleObj, clientData['op'])
        if not serviceHandleMethod:
            self.sendErrMsgToCurUser('无效操作，请不要恶意攻击!')
            return
        #父类检测
        serviceHandleInitMethod = MyUtil.getClassMethodByStrName(serviceHandleObj, 'initHandle')
        if not serviceHandleInitMethod:
            self.sendErrMsgToCurUser('内部错误(initHandle),请联系管理员!')
            return
        #初始化handle
        serviceHandleInitMethod(self)
        #调用业务方法处理
        retData=serviceHandleMethod()


    #重写父类方法，额外处理用户
    @method_decorator(AnnoUser.channelLoginRequired)
    def disconnect(self, message, **kwargs):
        """
        处理客户端ws_disconnect断开消息,
        如果定义了组，父类会自动维护踢出组
        """
        super().disconnect(message, **kwargs)

        #当前玩家删除redis缓存
        MyUtil.logInfo('玩家:{},删除断开连接'.format(message.reply_channel.name))


