'''
Created on 2017年6月22日

@author: xiaoxi
'''
from django.core import validators
from django_redis import get_redis_connection
from django_redis.cache import RedisCache
import pickle
import ast


class CacheUtil:
    redisConnect = get_redis_connection('default')
    redisConnectPool = redisConnect.connection_pool
    @classmethod
    def push(cls,queueName,val):
        # redisConnect=RedisCache()#代码提示用
        # print(con.connection_pool)
        # redisConnectPool=redisConnect.connection_pool
        return cls.redisConnect.lpush(queueName,val)

    @classmethod
    def pop(cls,queueName):
        oriVal=cls.redisConnect.rpop(queueName)
        if not oriVal:
            return oriVal
        return eval(oriVal.decode('utf-8'))

    @classmethod
    def len(cls,queueName):
        return cls.redisConnect.llen(queueName)

    @classmethod
    def hset(cls, hashKey, itemKey, val):
        return cls.redisConnect.hset(hashKey, itemKey, val)

    @classmethod
    def hmset(cls, hashKey, mapping):
        return cls.redisConnect.hmset(hashKey, mapping)

    @classmethod
    def expire(cls,name, time):
        return cls.redisConnect.expire(name, time)

    @classmethod
    def hsetnx(cls, hashKey, itemKey, val):
        return cls.redisConnect.hsetnx(hashKey, itemKey, val)

    @classmethod
    def hmget(cls, hashKey, keys):
        oriVal = cls.redisConnect.hmget(hashKey, keys)
        if not oriVal:
            return oriVal
        return eval(oriVal.decode('utf-8'))

    @classmethod
    def hlen(cls, hashKey):
        return cls.redisConnect.hlen(hashKey)

    @classmethod
    def hget(cls, hashKey, itemKey):
        oriVal = cls.redisConnect.hget(hashKey, itemKey)
        if not oriVal:
            return oriVal
        return eval(oriVal.decode('utf-8'))

    @classmethod
    def hdel(cls, hashKey, *keys):
        return cls.redisConnect.hdel(hashKey, *keys)
        # oriVal = cls.redisConnect.hdel(hashKey, *keys)
        # if not oriVal:
        #     return oriVal
        # return eval(oriVal.decode('utf-8'))

    @classmethod
    def hgetall(cls, hashKey):
        return cls.__decodeDictBytesToDict(cls.redisConnect.hgetall(hashKey))
        #解码方式二
        # oriVal = cls.redisConnect.hgetall(hashKey)
        # if not oriVal:
        #     return oriVal
        #自动解码
        # retVal={}
        # for key, value in oriVal.items():
        #     key = key.decode('utf-8')
        #     value = value.decode('utf-8')
        #     retVal[key]=eval(value)
        # return retVal



    @classmethod
    def hkeys(cls, hashKey):
        return cls.redisConnect.hkeys(hashKey)

    @classmethod
    def hvals(cls, hashKey):
        oriVal = cls.redisConnect.hvals(hashKey)
        if not oriVal:
            return oriVal
        return eval(oriVal.decode('utf-8'))


    @classmethod
    def keys(cls, keys):
        return cls.__decodeDictBytesToDict(cls.redisConnect.keys(keys))

    @classmethod
    def incr(cls, key,amount=1):
        return cls.redisConnect.incr(key,amount)

    @classmethod
    def set(cls, key,val,expireSeconds=3600):
        return cls.redisConnect.set(key,val,expireSeconds)

    @classmethod
    def get(cls, key):
        return cls.__decodeDictBytesToDict(cls.redisConnect.get(key))

    @classmethod
    def delete(cls, key):
        return cls.redisConnect.delete(key)

    @classmethod
    def deleteByKeyPrefix(cls, keyPrefix):
        keyLikes = cls.keys(keyPrefix+'*')
        delKeys=[]
        for eachHashKey in keyLikes:
            delKeys.append(eachHashKey)
            cls.delete(eachHashKey)
        return delKeys

    @classmethod
    def __decodeDictBytesToDict(cls,data):
        if isinstance(data, bytes):
            return data.decode()
        if isinstance(data, (str, int)):
            return str(data)
        if isinstance(data, dict):
            return dict(map(cls.__decodeDictBytesToDict, data.items()))
        if isinstance(data, tuple):
            return tuple(map(cls.__decodeDictBytesToDict, data))
        if isinstance(data, list):
            return list(map(cls.__decodeDictBytesToDict, data))
        if isinstance(data, set):
            return set(map(cls.__decodeDictBytesToDict, data))