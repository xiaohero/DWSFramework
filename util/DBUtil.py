'''
Created on 2017年6月22日

@author: xiaoxi
'''
from django.db import models


from util.MyUtil import MyUtil
class DBUtil:
    @classmethod
    def getDjModelObjects(cls,modelName,mainCoinCode='BTC') -> models.manager.Manager:
        mainCoinCode = mainCoinCode.strip().upper()
        dbName=mainCoinCode if 'BTC'!=mainCoinCode else 'default'
        return MyUtil.getClassByStrName('Xnb.models', modelName).objects.using(dbName)
