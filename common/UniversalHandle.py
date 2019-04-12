'''
Created on Jul 1, 2017

@author: xiaoxi
'''
import json
from django.db.models.fields import related_descriptors
from django.db.models.query import QuerySet
from util.MyUtil import MyUtil


class UniversalHandle:
    '''
    基础服务类
    '''

    def __init__(self, clsName, op, host,data):
        self.clsName = clsName
        self.op = op
        self.host = host
        self.isInitCheckOk = True
        # self.data = data
        # data json串转动态对象
        self.data = json.loads(data)
    def initHandle(self, websocketAction):
        self.websocketAction=websocketAction
        pass

