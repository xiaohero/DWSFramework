'''
Created on Jul 1, 2017

@author: xiaoxi
'''

from util.CacheUtil import CacheUtil
from service.xnb.store.StoreBase import StoreBase
from datetime import datetime
from util.ConstUtil import ConstUtil





class StoreByRedis2(StoreBase):
    ''':
    #通过redis存储数据，跨程序，外部可获取,热更新数据不会丢失
    '''
    __redisKeyPrefix=ConstUtil.REDIS_STORE+':SR2'

    def __init__(self):
        '''
        构造函数
        '''
    @classmethod
    def save(cls,cachePrefix, key1, key2, dictInfo,expireSeconds=300):
        hashKey1='{}:{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key1,key2)
        hashKey2='{}:{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key2,key1)
        #dictInfo为空时代表删除该元素
        if not dictInfo:
            isOk1=CacheUtil.delete(hashKey1)
            isOk2=CacheUtil.delete(hashKey2)
            # print('时间:{},StoreByRedis2:删除key1:{},key2:{}'.format(datetime.now(),hashKey1, hashKey2))
            return
        # print('当前币信息存StoreByRedis2缓存:{}:{}'.format(isOk1,isOk2))
        newDictInfo={}
        for key,value in dictInfo.items():
            # value设置为空，默认就删除该元素
            if value is not None:
                newDictInfo[key]=value
                # isOk1=CacheUtil.hset(hashKey1,key,value)
                # isOk2=CacheUtil.hset(hashKey2,key,value)
                # CacheUtil.expire(hashKey1, expireSeconds)
                # CacheUtil.expire(hashKey2, expireSeconds)
                # print('时间:{},StoreByRedis2:保存key1:{},key2:{},key:{},value:{},isOk1:{},isOk2:{},time:{}'.format(datetime.now(),hashKey1, hashKey2,key,value,isOk1,isOk2,expireSeconds))
            else:
                # MyUtil.logInfo('时间:{},StoreByRedis2:删除key1:{},key2:{},key:{}'.format(datetime.now(),hashKey1,hashKey2,key))
                isOk1=CacheUtil.hdel(hashKey1,key)
                isOk2=CacheUtil.hdel(hashKey2,key)
        #虑批量hmset比上面for循环方式快，且对redis压力小
        if len(newDictInfo)>0:
            CacheUtil.hmset(hashKey1, newDictInfo)
            CacheUtil.hmset(hashKey2, newDictInfo)
            # 延迟过期时间
            CacheUtil.expire(hashKey1, expireSeconds)
            CacheUtil.expire(hashKey2, expireSeconds)
            #StoreByRedis2:REDIS_USDT:SAVE_CUR_COINS:ETH:huobi
            # print('时间:{},StoreByRedis2:保存key1:{},key2:{},value:{},过期延迟:{}'.format(datetime.now(), hashKey1, hashKey2,newDictInfo, expireSeconds))

    @classmethod
    def getByKey1Key2(cls,cachePrefix, key1, key2):
        hashKey1='{}:{}:{}:{}'.format(cls.__redisKeyPrefix,cachePrefix,key1,key2)
        return CacheUtil.hgetall(hashKey1)

    @classmethod
    def getByKey1(cls,cachePrefix, key1):
        hashKey1Prefix='{}:{}:{}:'.format(cls.__redisKeyPrefix,cachePrefix,key1)
        hashKey1Likes=CacheUtil.keys(hashKey1Prefix+'*')
        retDict={}
        for eachHashKey1 in hashKey1Likes:
            retDict[eachHashKey1.replace(hashKey1Prefix,'')]=CacheUtil.hgetall(eachHashKey1)
            # print(eachHashKey1)
            # print(CacheUtil.hgetall(eachHashKey1))
        return retDict if retDict else None
        # {'btsd': {'sell1Price': 12, 'buy1Price': 22}, 'jb': {'sell1Price': 10, 'buy1Price': 20},
        #  'ybw': {'sell1Price': 11, 'buy1Price': 21}}

    @classmethod
    def getByKey2(cls,cachePrefix, key2):
        hashKey2Prefix='{}:{}:{}:'.format(cls.__redisKeyPrefix,cachePrefix,key2)
        hashKey1Likes=CacheUtil.keys(hashKey2Prefix+'*')
        retDict={}
        for eachHashKey2 in hashKey1Likes:
            retDict[eachHashKey2.replace(hashKey2Prefix,'')]=CacheUtil.hgetall(eachHashKey2)
        return retDict if retDict else None

    @classmethod
    def getAll(cls,cachePrefix):
        # hashKeyPrefix = '{}:{}*'.format(cls.__redisKeyPrefix, cachePrefix)
        # hashKeyLikes = CacheUtil.keys(hashKeyPrefix)
        # for eachHashKey in hashKeyLikes:
        #     print( eachHashKey.replace('{}:{}:'.format(cls.__redisKeyPrefix, cachePrefix),''))
        pass

    @classmethod
    def getAllKeys(cls,cachePrefix):
        hashKeyPrefix = '{}:{}*'.format(cls.__redisKeyPrefix, cachePrefix)
        hashKeyLikes = CacheUtil.keys(hashKeyPrefix)
        return hashKeyLikes


    @classmethod
    def clearAll(cls,cachePrefix):
        hashKeyPrefix='{}:{}*'.format(cls.__redisKeyPrefix,cachePrefix)
        # print('时间:{},StoreByRedis2:清除keys:{}'.format(datetime.now(),hashKeyPrefix))
        hashKeyLikes = CacheUtil.keys(hashKeyPrefix)
        for eachHashKey in hashKeyLikes:
            CacheUtil.redisConnect.delete(eachHashKey)