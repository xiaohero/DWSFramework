'''
Created on Jul 1, 2017

@author: xiaoxi
'''
from channels.generic.websockets import WebsocketConsumer
import json
from channels.auth import channel_and_http_session_user_from_http,channel_session_user_from_http
from channels.sessions import enforce_ordering
from django.utils.decorators import method_decorator
from ..annotation.AnnoUser import AnnoUser
from ..util.WebsocketUtil import WebsocketUtil
from ..util.MyUtil import MyUtil



# AnnoUser.channelLoginRequired不能挂在receive下，因为要求第一个参数必须是message类型,所以必须挂到raw_receive下，借助@method_decorator可注解到类上面
# 这样就不用重写父类raw_receive方法了
@method_decorator(AnnoUser.channelLoginRequired,'raw_receive')
class UniversalWebsocket(WebsocketConsumer):
    '''
    websocket基础类,特别注意：connect,ws_message,ws_disconnect每种消息回调函数进入都会产生新对象new MainWsXNB(),
    所以不要在对象属性中存储全局变量
    '''

        
    # Set to True to automatically port users from HTTP cookies
    # (you don't need channel_session_user, this implies it)
    http_user = True
    http_user_and_session=True

    # Set to True if you want it, else leave it out
    strict_ordering = False
    
    #定义组名，可以定义常量groups（如果静态组名）或con覆盖nection_groups（好处是函数里可动态控制组名返回）
    #groups=[]

    #新增注解变量控制(由于loginRequired需要放到channel_session后面，故需重写父类方法)
    wsLoginRequired=False

    def __init__(self, message):
        '''
        构造函数
        '''
        #MyUtil.logInfo('进入BaseWebsocket构造函数:hash:{}:'.format(self.__hash__()))
        #记住这里要调用父类构造函数
        super().__init__(message)


    #重写父类方法
    def get_handler2(self, message, **kwargs):
        handler=super().get_handler(message, **kwargs)
        # 未配置loginRequired时直接走父类方法
        if self.wsLoginRequired:
            handler=AnnoUser.channelLoginRequiredBeforeHandler(handler)
        return handler

    #重写父类方法
    def get_handler1(self,message, **kwargs):
        #未配置loginRequired时直接走父类方法
        if not self.wsLoginRequired:
            return super().get_handler(message, **kwargs)

        #否则重写实现父类方法，因为login_required注解必须在channel_session后面
        #下面代码大部分从父类copy而来
        # HTTP user implies channel session user
        if self.http_user or self.http_user_and_session:
            self.channel_session_user = True
        # Get super-handler
        self.path = message['path']
        
        #获取父类的父类BaseConsumer().handler方法
        handler = super(WebsocketConsumer,self).get_handler(message, **kwargs)

        #先用wsLoginRequired注解包装一层
        handler = AnnoUser.channelLoginRequiredAfterHandler(handler)

        # Optionally apply HTTP transfer
        if self.http_user_and_session:
            handler = channel_and_http_session_user_from_http(handler)
        elif self.http_user:
            handler = channel_session_user_from_http(handler)

        # Ordering decorators
        if self.strict_ordering:
            return enforce_ordering(handler, slight=False)
        elif getattr(self, "slight_ordering", False):
            raise ValueError("Slight ordering is now always on. Please remove `slight_ordering=True`.")
        else:
            return handler


    def connection_groups(self, **kwargs):
        """
        获取组名，connect时由父类调用
        动态定义组名，父类connect和disconnect自动维护组关系
        list类型，可加入多个组，会自动将当前connect客户端分别加入
        各个组维护,不分组的话可返回空元组
        """
        # roomName='DWS'+self.path.replace('/','_')
        roomName=MyUtil.getWsRoomName()

        # 方案1.组名存到self.groups(经验证不可行，因为每次connect,ws_message不同到消息都会产生新对象，self.groups是对象属性，各自独立)
        # self.groups=[roomName]
        # 方案2.组名存到channel_session
        self.message.channel_session['room'] = roomName
        #print('roomName:'+roomName)
        return [roomName]

    #加入注解，需登录后才能连接
    @method_decorator(AnnoUser.channelLoginRequired)
    def connect(self, message, **kwargs):
        """
        处理connect消息，如果无特殊处理需求可以不用覆盖该方法，父类会自动默认处理
        """
        #直接调用父类方法处理
        super().connect(message)

        #记录客户端信息,以便全局访问
        self.message.channel_session['clientInfo'] = {
            'ip':message.content['client']
        }
        MyUtil.logInfo('客户端({}) username:({}) IP:{} 请求连接:'.format(message.reply_channel,message.user.username, message.content['client']))
        #广播全组欢迎消息
        # self.sendToGroupAll('欢迎:'+self.message.user.username+' 进入房间')


    '''
    # @method_decorator(AnnoUser.channelLoginRequired)
    def receive(self, text=None, bytes=None, **kwargs):
        """
        处理ws_message消息，自定义逻辑
        """
        MyUtil.logInfo('客户端({}) username:({}) 发来消息:{}'.format(self.message.reply_channel,self.message.user.username, self.message.content['text']))
        #组内转发其他人消息
        retText={'msg':'用户：'+self.message.user.username+' 发来消息:'+text}
        self.sendToGroupOthers(retText)
    '''

    @method_decorator(AnnoUser.channelLoginRequired)
    def disconnect(self, message, **kwargs):
        """
        处理客户端ws_disconnect断开消息,
        如果定义了组，父类会自动维护踢出组
        """
        #直接调用父类方法处理
        super().disconnect(message)
        MyUtil.logInfo('客户端({}) username:({}) 断开连接:'.format(message.reply_channel,message.user.username))
        #给其它用户广播xx用户离开消息
        # self.sendToGroupOthers(self.message.user.username+'离开房间')


    #额外封装方法
    def sendSucMsgToCurUser(self, msg,targetUrl=''):
        """
        发送消息给当前用户
        """
        self.message.reply_channel.send({'text':json.dumps(WebsocketUtil.makeSuccessMsg(msg,targetUrl=targetUrl))})

    def sendSucMsgToOne(self, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        originChannelLayer=self.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(WebsocketUtil.makeSuccessMsg(msg,targetUrl=targetUrl)),
        })

    def sendMainLogMsgToOne(self, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#myLogMain','red');".format(msg)
        originChannelLayer=self.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(WebsocketUtil.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })

    def sendSecondLogMsgToOne(self, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#myLogSecond','green');".format(msg)
        originChannelLayer=self.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(WebsocketUtil.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })

    def sendTopLogMsgToOne(self, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#warnMsg','blue');".format(msg)
        originChannelLayer=self.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(WebsocketUtil.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })

    #额外封装方法
    def sendToGroupAll(self, msg):
        """
        当前组内群发所有用户消息
        """
        self.group_send(self.getRoomName(), json.dumps(WebsocketUtil.makeSuccessMsg(msg)))
        # self.getOriginChannelLayer().send_group(roomName,text) #方法1

    def sendToGroupOthers(self, msg):
        """
        当前组内群发所有用户消息
        """
        originChannelLayer=self.getOriginChannelLayer()
        groupChannels=self.getGroupChannels()

        #print('xxx')
        #MyUtil.logObjInfo(originChannelLayer)
        # Group(self.getRoomName()).channel_layer

        #群发内类用户消息（排除自己）
        for eachChannel in groupChannels:
            #排除当前用户自己
            if eachChannel == self.message.reply_channel.name:
                continue
            originChannelLayer.send(eachChannel, {
                "text": json.dumps(WebsocketUtil.makeSuccessMsg(msg)),
            })

    def sendToGroupOnesByChannelNames(self, channelNames,msg):
        """
        发送指定某些用户消息
        """
        originChannelLayer=self.getOriginChannelLayer()
        groupChannels=self.getGroupChannels()
        for eachChannel in groupChannels:
            # 只发给指定用户消息
            if eachChannel in channelNames:
                MyUtil.logInfo('用户满足条件:'+eachChannel)
                originChannelLayer.send(eachChannel, {
                    "text": json.dumps(WebsocketUtil.makeSuccessMsg(msg)),
                })

    def sendErrMsgToCurUser(self, errMsg, errCode=-1000,targetUrl=''):
        MyUtil.logWarning(self.getClientDebugDesc() +'-'+ errMsg +'-'+self.message.content['text'])
        self.message.reply_channel.send({'text':json.dumps(WebsocketUtil.makeErrMsg(errMsg, errCode,targetUrl=targetUrl))})

    def getGroupChannels(self):
        """
        获取组内所有channels names
        """
        return self.getOriginChannelLayer().group_channels(self.getRoomName())

    def getOriginChannelLayer(self):
        """
        获取self.message.channel_layer.channel_layer
        """
        # return Group(self.getRoomName()).channel_layer#方法1
        return self.message.channel_layer.channel_layer  # 方法2

    def getRoomName(self):
        """
        获取当前组名
        """
        return self.message.channel_session['room']

    def getClientDebugDesc(self):
        return '(客户端IP:{},用户名:{})'.format(self.message.channel_session['clientInfo']['ip'],self.message.user.username)

