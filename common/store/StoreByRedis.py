'''
Created on Jul 1, 2017

@author: xiaoxi
'''

from ...util.CacheUtil import CacheUtil
from ...util.MyUtil import MyUtil
from .StoreBase import StoreBase


class StoreByRedis(StoreBase):
    ''':
    #通过redis存储数据，跨程序，外部可获取,热更新数据不会丢失
    '''
    __redisKeyPrefix=MyUtil.REDIS_STORE+':SR1'

    def __init__(self):
        '''
        构造函数
        '''
    @classmethod
    def save(cls,cachePrefix, key1, key2, dictInfo,expireSeconds=300):
        hashKey1='{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key1)
        hashKey2='{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key2)

        # dictInfo为空时代表删除该元素
        if not dictInfo:
            isOk1 = CacheUtil.delete(hashKey1)
            isOk2 = CacheUtil.delete(hashKey1)
            return

        isOk1=CacheUtil.hsetnx(hashKey1,key2,dictInfo)
        if not isOk1:
            oldVal=CacheUtil.hget(hashKey1,key2)
            # isOK1=CacheUtil.hset(hashKey1,key2,{**oldVal,**dictInfo})#python3.5新语法
            isOK1=CacheUtil.hset(hashKey1,key2,{oldVal.update(dictInfo)})#合并dict
        isOk2=CacheUtil.hsetnx(hashKey2,key1,dictInfo)
        if not isOk2:
            oldVal=CacheUtil.hget(hashKey2,key1)
            isOK2=CacheUtil.hset(hashKey2,key1,dictInfo)

        CacheUtil.expire(hashKey1, expireSeconds)
        CacheUtil.expire(hashKey2, expireSeconds)
        # MyUtil.logInfo('当前币信息存StoreByRedis缓存:')
        # MyUtil.logObjInfo(CacheUtil.hgetall(hashKey1))
        # {'jb': {'buy1Price': '286.300000', 'sell1Price': '288.000000'}, 'ybw': {'buy1Price': 21, 'sell1Price': 11},
        #  'btsd': {'buy1Price': 22, 'sell1Price': 12}}

    @classmethod
    def getByKey1Key2(cls,cachePrefix, key1, key2):
        hashKey1='{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key1)
        return CacheUtil.hget(hashKey1,key2)

    @classmethod
    def getByKey1(cls,cachePrefix, key1):
        hashKey1='{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key1)
        return CacheUtil.hgetall(hashKey1)

    @classmethod
    def getByKey2(cls,cachePrefix, key2):
        hashKey2='{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key2)
        return CacheUtil.hgetall(hashKey2)

    @classmethod
    def getAll(cls,cachePrefix):
        pass

    @classmethod
    def getAllKeys(cls,cachePrefix):
        hashKeyPrefix = '{}:{}*'.format(cls.__redisKeyPrefix, cachePrefix)
        hashKeyLikes = CacheUtil.keys(hashKeyPrefix)
        return hashKeyLikes

    @classmethod
    def clearAll(cls,cachePrefix):
        hashKeyPrefix='{}:{}:*'.format(cls.__redisKeyPrefix,cachePrefix)
        hashKeyLikes = CacheUtil.keys(hashKeyPrefix)
        for eachHashKey in hashKeyLikes:
            CacheUtil.redisConnect.delete(eachHashKey)