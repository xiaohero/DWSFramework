'''
Created on Jul 1, 2017

@author: xiaoxi
'''
import abc

from .UniversalHandle import UniversalHandle

class BaseHandle(UniversalHandle):
    __metaclass__ = abc.ABCMeta
    '''
    虚拟币基类服务类
    '''

    def __init__(self, clsName, op, host,data):
        super().__init__(clsName, op, host, data)
    def initHandle(self, websocketAction):
        #先调基类
        super().initHandle(websocketAction)
    '''
    子类必须实现该方法，用于判断当前前端页面是否命中条件，以便后续自动注入chm-ext front js
    '''
    @abc.abstractmethod
    def filterSite(self)->bool:
        return False
        #raise NotImplementedError('Should have implemented this')