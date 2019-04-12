'''
Created on Jul 1, 2017

@author: xiaoxi
'''

from service.xnb.store.StoreByRedis2 import StoreByRedis2
from service.xnb.store.StoreByPy import StoreByPy


class StoreService:
    '''
    当前各平台币存储服务类
    '''
    @classmethod
    #获取实现存储类
    def getStoreCls(cls):
        # return StoreByPy
        #return StoreByRedis
        return StoreByRedis2
    
    
