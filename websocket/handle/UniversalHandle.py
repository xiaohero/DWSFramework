'''
Created on Jul 1, 2017

@author: xiaoxi
'''
import json

class UniversalHandle:
    '''
    基础服务类
    '''

    def __init__(self, clsName, op, host,clientExtId,data,**kwargs):
        self.clsName = clsName
        self.op = op
        self.host = host
        self.clientExtId = clientExtId
        self.isInitCheckOk = True
        # self.data = data
        # data json串转动态对象
        self.data = json.loads(data)
    def initHandle(self, websocketAction):
        self.websocketAction=websocketAction
        return True

    def comParamsCheck(self,dictObj,*keys):
        if not (isinstance(dictObj,dict) and dictObj and keys):
            return False
        isOk=True
        for k in keys:
            if not (k in dictObj and dictObj[k]):
                isOk = False
                break
        return isOk