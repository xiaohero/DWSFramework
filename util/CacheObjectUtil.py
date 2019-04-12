'''
Created on 2017年6月22日

@author: xiaoxi
'''
from django_redis import get_redis_connection
import pickle


class CacheObjectUtil:
    redisConnect = get_redis_connection('default')
    redisConnectPool = redisConnect.connection_pool
    @classmethod
    def push(cls,queueName,val):
        return cls.redisConnect.lpush(queueName,pickle.dumps(val))

    @classmethod
    def pop(cls,queueName):
        oriVal=cls.redisConnect.rpop(queueName)
        if not oriVal:
            return oriVal
        return pickle.loads(oriVal)

    @classmethod
    def len(cls,queueName):
        return cls.redisConnect.llen(queueName)

    @classmethod
    def hset(cls,hashKey,itemKey,val):
        return cls.redisConnect.hset(hashKey,itemKey,pickle.dumps(val))


    @classmethod
    def hmset(cls, hashKey, mapping):
        return cls.redisConnect.hmset(hashKey, pickle.dumps(mapping))

    @classmethod
    def expire(cls,name, time):
        return cls.redisConnect.expire(name, time)

    @classmethod
    def hsetnx(cls,hashKey,itemKey,val):
        return cls.redisConnect.hsetnx(hashKey,itemKey,pickle.dumps(val))

    @classmethod
    def hmget(cls,hashKey,keys):
        oriVal=cls.redisConnect.hmget(hashKey,keys)
        if not oriVal:
            return oriVal
        return pickle.loads(oriVal)

    @classmethod
    def hlen(cls,hashKey):
        return cls.redisConnect.hlen(hashKey)

    @classmethod
    def hget(cls,hashKey,itemKey):
        oriVal = cls.redisConnect.hget(hashKey,itemKey)
        if not oriVal:
            return oriVal
        return pickle.loads(oriVal)

    @classmethod
    def hdel(cls, hashKey, *keys):
        return cls.redisConnect.hdel(hashKey, *keys)

    @classmethod
    def hgetall(cls,hashKey):
        oriVal = cls.redisConnect.hgetall(hashKey)
        if not oriVal:
            return oriVal
        return pickle.loads(oriVal)

    @classmethod
    def hkeys(cls,hashKey):
        return cls.redisConnect.hkeys(hashKey)

    @classmethod
    def hvals(cls, hashKey):
        oriVal = cls.redisConnect.hvals(hashKey)
        if not oriVal:
            return oriVal
        return pickle.loads(oriVal)

    @classmethod
    def keys(cls, keys):
        return cls.__decodeDictBytesToDict(cls.redisConnect.keys(keys))
        # oriVal = cls.redisConnect.get(keys)
        # if not oriVal:
        #     return oriVal
        # return pickle.loads(oriVal)

    @classmethod
    def incr(cls, key,amount=1):
        return cls.redisConnect.incr(key,amount)

    @classmethod
    def set(cls, key,val,expireSeconds=3600):
        return cls.redisConnect.set(key,pickle.dumps(val),expireSeconds)

    @classmethod
    def get(cls, key):
        oriVal = cls.redisConnect.get(key)
        if not oriVal:
            return oriVal
        return pickle.loads(oriVal)

    @classmethod
    def delete(cls, key):
        return cls.redisConnect.delete(key)

    @classmethod
    def deleteByKeyPrefix(cls, keyPrefix):
        keyLikes = cls.keys(keyPrefix+'*')
        for eachHashKey in keyLikes:
            cls.delete(eachHashKey)

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
