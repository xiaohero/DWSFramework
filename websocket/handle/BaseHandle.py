'''
Created on Jul 1, 2017

@author: xiaoxi
'''
import abc

from ...common.OnlineUsers import OnlineUsers
from .UniversalHandle import UniversalHandle

class BaseHandle(UniversalHandle):
    __metaclass__ = abc.ABCMeta
    '''
    虚拟币基类服务类
    '''

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    '''
    子类必须实现该方法，并返回bool型,以便后续是否调用相关handle的op方法
    '''
    def initHandle(self, websocketAction):
        #先调基类
        super().initHandle(websocketAction)
        #记录当前登录用户
        self.user=self.websocketAction.message.user
        self.wsPath=self.websocketAction.message.content['path']
        self.clientIp=self.websocketAction.message.channel_session['clientInfo']['ip'][0]
        self.wsChannelId=self.websocketAction.message.content['reply_channel']
        self.clientUuidId = OnlineUsers.getClientUuidId(self.user.username,self.wsChannelId)
        #更新当前用户url
        OnlineUsers.updateUser(wsChannelId=self.wsChannelId,wsPath=self.wsPath,userName=self.user.username,clientIp=self.clientIp,clientUrl=self.host,clientExtId=self.clientExtId,clientUuidId=self.clientUuidId)
        return True