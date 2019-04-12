'''
Created on Jul 1, 2017

@author: xiaoxi
'''
from .UniversalHandle import UniversalHandle

class BaseHandle(UniversalHandle):
    '''
    虚拟币基类服务类
    '''

    def __init__(self, clsName, op, host,data):
        super().__init__(clsName, op, host, data)
    def initHandle(self, websocketAction):
        #先调基类
        super().initHandle(websocketAction)