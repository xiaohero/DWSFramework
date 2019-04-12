'''
Created on Jul 1, 2017

@author: xiaoxi
'''

import abc


class StoreBase:
    # __metaclass__ = abc.ABCMeta

    '''
    当前各平台币存储基类
    '''

    def __init__(self):
        '''
        构造函数
        '''
    @classmethod
    @abc.abstractstaticmethod
    #模拟虚函数(静态虚函数)
    def save(cls, cachePrefix,key1, key2, dictInfo,expireSeconds=300):
        pass


    @classmethod
    @abc.abstractstaticmethod
    def getByKey1Key2(cls, cachePrefix,key1, key2):
        pass

    @classmethod
    @abc.abstractstaticmethod
    def getByKey1(cls, cachePrefix,key1):
        pass


    @classmethod
    @abc.abstractstaticmethod
    def getByKey2(cls, cachePrefix,key2):
        pass

    @classmethod
    @abc.abstractstaticmethod
    def getAll(cls, cachePrefix):
        pass

    @classmethod
    @abc.abstractstaticmethod
    def clearAll(cls, cachePrefix):
        pass


    
    
