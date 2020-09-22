'''
Created on Jul 1, 2017

@author: xiaoxi
'''
import json
from builtins import isinstance

import re
from django.utils.decorators import method_decorator

from ..common.OnlineUsers import OnlineUsers
from .UniversalWebsocket import UniversalWebsocket
from ..util.MyUtil import MyUtil
from ..annotation.AnnoUser import AnnoUser

class BaseWebsocketAction(UniversalWebsocket):
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
        if not (isinstance(clientData,dict) and 'clsName' in clientData and 'op' in clientData and 'host' in clientData and 'clientExtId' in clientData and 'data' in clientData and isinstance(clientData['data'],str)):
            self.sendErrMsgToCurUser('格式错误，非法请求，请不要恶意攻击!')
            return
        #判断服务类是否存在
        handleModulPath1=MyUtil.getProjectName()+'.websocket.'+clientData['clsName']
        serviceHandleCls=MyUtil.getClassByStrName(handleModulPath1,clientData['clsName'])
        if not serviceHandleCls:
            #再从DWS框架websocket目录找一下
            handleModulPath2=MyUtil.getFrameworkName() + '.websocket.' + clientData['clsName']
            MyUtil.logInfo('工程内未找到指定handle，尝试从框架目录查找:{}'.format(handleModulPath2))
            serviceHandleCls = MyUtil.getClassByStrName(handleModulPath2,clientData['clsName'])
            if not serviceHandleCls:
                self.sendErrMsgToCurUser('无效业务({}.{})，请不要恶意攻击!'.format(handleModulPath1,clientData['clsName']))
                return
        serviceHandleObj=serviceHandleCls(**clientData)
        #判断业务方法是否存在
        serviceHandleMethod=MyUtil.getClassMethodByStrName(serviceHandleObj, clientData['op'])
        if not serviceHandleMethod:
            self.sendErrMsgToCurUser('无效操作({})，请不要恶意攻击!'.format(clientData['op']))
            return
        #父类检测
        serviceHandleInitMethod = MyUtil.getClassMethodByStrName(serviceHandleObj, 'initHandle')
        if not serviceHandleInitMethod:
            self.sendErrMsgToCurUser('内部错误(initHandle),请联系管理员!')
            return
        #初始化handle
        initResult=serviceHandleInitMethod(self)
        #调用业务方法处理
        initResult and serviceHandleMethod()



    #重写父类方法，额外处理
    @method_decorator(AnnoUser.channelLoginRequired)
    def disconnect(self, message, **kwargs):
        """
        处理客户端ws_disconnect断开消息,
        如果定义了组，父类会自动维护踢出组
        """
        super().disconnect(message, **kwargs)
        #当前玩家删除redis
        OnlineUsers.removeByChannelId(message.reply_channel.name)

    #重写父类方法，额外处理
    @method_decorator(AnnoUser.channelLoginRequired)
    def connect(self, message, **kwargs):
        """
        处理connect消息，如果无特殊处理需求可以不用覆盖该方法，父类会自动默认处理
        """
        #直接调用父类方法处理
        super().connect(message)
        #当前玩家保存redis
        reqHeaderStr=(str(self.message.content['headers']))
        findClientAgents = re.findall("agent', b'([^']+)']", reqHeaderStr)
        findClientUrls = re.findall("b'origin', b'([^']+)']", reqHeaderStr)
        OnlineUsers.updateUser(wsChannelId=self.message.content['reply_channel'],wsPath=self.message.content['path'],userName=self.message.user.username,clientIp=message.content['client'][0],clientUrl=findClientUrls[0] if findClientUrls else '',clientAgent=findClientAgents[0] if findClientAgents else '')


    @classmethod
    def getDefaultRouteConf(cls):
        from channels.routing import route_class
        return route_class(
            BaseWebsocketAction, path=r'^/{}/Main'.format(MyUtil.getProjectName())
        )