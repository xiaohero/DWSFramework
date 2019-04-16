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

    def __init__(self, clsName, op, host,data):
        super().__init__(clsName, op, host, data)

    '''
    子类必须实现该方法，并返回bool型,以便后续是否调用相关handle的op方法
    '''
    def initHandle(self, websocketAction):
        #先调基类
        super().initHandle(websocketAction)
        #记录当前登录用户
        self.user=self.websocketAction.message.user
        #更新当前用户url
        OnlineUsers.updateUser(wsChannelId=self.websocketAction.message.content['reply_channel'],wsPath=self.websocketAction.message.content['path'],userName=self.websocketAction.message.user.username,clientUrl=self.host)
        return True