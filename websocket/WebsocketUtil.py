'''
Created on 2019年04月16日

@author: xiaoxi
'''
from ..util.MyUtil import MyUtil
import json
from channels.channel import Group


class WebsocketUtil:
    @classmethod
    def closeClientByChannelId(cls, channelId, msg='close', targetUrl=''):
        """
        发送关闭消息给指定用户
        """
        originChannelLayer=cls._getOriginChannelLayer()
        originChannelLayer.send(channelId, {
            "text": json.dumps(cls.makeSuccessMsg(msg,targetUrl=targetUrl)),
            "close":True
        })

    @classmethod
    def sendSucMsgToOne(cls, channelId, msg, targetUrl=''):
        """
        发送消息给指定用户
        """
        originChannelLayer=cls._getOriginChannelLayer()
        originChannelLayer.send(channelId, {
            "text": json.dumps(cls.makeSuccessMsg(msg,targetUrl=targetUrl)),
        })
    @classmethod
    def sendMainLogMsgToOne(cls, channelId,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#myLogMain','red');".format(msg)
        originChannelLayer=cls._getOriginChannelLayer()
        originChannelLayer.send(channelId, {
            "text": json.dumps(cls.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })
    @classmethod
    def sendSecondLogMsgToOne(cls, channelId,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#myLogSecond','green');".format(msg)
        originChannelLayer=cls._getOriginChannelLayer()
        originChannelLayer.send(channelId, {
            "text": json.dumps(cls.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })
    @classmethod
    def sendTopLogMsgToOne(cls, channelId,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#warnMsg','blue');".format(msg)
        originChannelLayer=cls._getOriginChannelLayer()
        originChannelLayer.send(channelId, {
            "text": json.dumps(cls.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })

    @classmethod
    def _getOriginChannelLayer(cls):
        """
        获取self.message.channel_layer.channel_layer
        """
        return Group(MyUtil.getWsRoomName()).channel_layer#方法1

    @classmethod
    def makeSuccessMsg(cls, jsCode,successMsg='成功',targetUrl=''):
        #防止直接输出文本，加入打日志函数包裹
        if not ';' in jsCode:
            jsCode="('undefined'!=typeof myUtils)?myUtils.log('{}'):console.log('{}')".format(jsCode,jsCode)
        #拼凑返回值格式
        retData= {
            'code': 0,
            'targetUrl':targetUrl,
            'msg': successMsg,
            'data': {'exeJsCode':jsCode}
         }
        #下面的字段为兼容客户端老数据格式
        retData['op']='doTask'
        retData['data']=json.dumps(retData['data'])
        return retData

    @classmethod
    def makeErrMsg(cls, errMsg='失败',errCode=-10000,data=None,targetUrl=''):
        return {
            'code': errCode,
            'targetUrl': targetUrl,
            'msg': errMsg,
            'data': data
        }
