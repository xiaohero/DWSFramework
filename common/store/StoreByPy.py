'''
Created on Jul 1, 2017

@author: xiaoxi
'''

from .StoreBase import StoreBase


class StoreByPy(StoreBase):
    '''
    #通过python静态类变量存储数据，更快
    '''
    __staticCacheByKey1={}
    __staticCacheByKey2={}
    
    def __init__(self):
        '''
        构造函数
        '''
    @classmethod
    def save(cls, cachePrefix,key1, key2, dictInfo,expireSeconds=300):
        if not cachePrefix in cls.__staticCacheByKey1:
            cls.__staticCacheByKey1[cachePrefix]={}
        if not cachePrefix in cls.__staticCacheByKey2:
            cls.__staticCacheByKey2[cachePrefix]={}

        if not key1 in cls.__staticCacheByKey1[cachePrefix]:
            cls.__staticCacheByKey1[cachePrefix][key1]={}
        if not key2 in cls.__staticCacheByKey1[cachePrefix][key1]:
            cls.__staticCacheByKey1[cachePrefix][key1][key2]={}

        if not key2 in cls.__staticCacheByKey2[cachePrefix]:
            cls.__staticCacheByKey2[cachePrefix][key2]={}
        if not key1 in cls.__staticCacheByKey2[cachePrefix][key2]:
            cls.__staticCacheByKey2[cachePrefix][key2][key1]={}

        #dictInfo为空时代表删除该元素
        # if not dictInfo:
        #     del cls.__staticCacheByKey1[cachePrefix][key1][key2]
        #     del cls.__staticCacheByKey2[cachePrefix][key2][key1]
        #     # cls.__staticCacheByKey1[cachePrefix][key1].pop(key2)
        #     # cls.__staticCacheByKey2[cachePrefix][key2].pop(key1)
        #     return
        for key,value in dictInfo.items():
            #value设置为空，默认就删除该元素
            if value:
                cls.__staticCacheByKey1[cachePrefix][key1][key2][key]=value
                cls.__staticCacheByKey2[cachePrefix][key2][key1][key]=value
            else:
                del cls.__staticCacheByKey1[cachePrefix][key1][key2][key]
                del cls.__staticCacheByKey2[cachePrefix][key2][key1][key]
                # cls.__staticCacheByKey1[cachePrefix][key1][key2].pop(key)
                # cls.__staticCacheByKey2[cachePrefix][key2][key1].pop(key)
    @classmethod
    def getByKey1Key2(cls, cachePrefix,key1, key2):
        return cls.__staticCacheByKey1[cachePrefix][key1][key2]

    @classmethod
    def getByKey1(cls, cachePrefix,key1):
        if not key1 in cls.__staticCacheByKey1[cachePrefix]:
            return None
        return cls.__staticCacheByKey1[cachePrefix][key1]

    @classmethod
    def getByKey2(cls, cachePrefix,key2):
        if not key2 in cls.__staticCacheByKey2[cachePrefix]:
            return None
        return cls.__staticCacheByKey2[cachePrefix][key2]

    @classmethod
    def getAll(cls,cachePrefix):
        return cls.__staticCacheByKey1[cachePrefix]

    @classmethod
    def clearAll(cls,cachePrefix):
        cls.__staticCacheByKey1[cachePrefix]={}
        cls.__staticCacheByKey2[cachePrefix]={}
