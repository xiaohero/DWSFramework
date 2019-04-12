'''
Created on 2017年6月22日

@author: xiaoxi
'''
from util.MyUtil import MyUtil
class GlobalCache:
    #全局缓存器
    __caches={}
    __cacheModel=''#python,redis,session
    def __init__(self):
        pass

    @classmethod
    def getByKey(cls,cacheKey):
        if cacheKey in cls.__caches and MyUtil.isOnlineEnv():
            # MyUtil.logInfo('读取缓存:'+cacheKey)
            return cls.__caches[cacheKey]

    @classmethod
    def setCache(cls,cacheKey,cacheValue):
        cls.__caches[cacheKey]=cacheValue
