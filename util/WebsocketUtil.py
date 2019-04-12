'''
Created on 2017年6月22日

@author: xiaoxi
'''
from util.MyUtil import MyUtil
import json
from channels.channel import Group


class WebsocketUtil:
    @classmethod
    def sendSucMsgToOne(cls, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        originChannelLayer=cls.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(cls.makeSuccessMsg(msg,targetUrl=targetUrl)),
        })
    @classmethod
    def sendMainLogMsgToOne(cls, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#myLogMain','red');".format(msg)
        originChannelLayer=cls.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(cls.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })
    @classmethod
    def sendSecondLogMsgToOne(cls, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#myLogSecond','green');".format(msg)
        originChannelLayer=cls.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(cls.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })
    @classmethod
    def sendTopLogMsgToOne(cls, channelName,msg,targetUrl=''):
        """
        发送消息给指定用户
        """
        jsCodes = "myUtils.logInfos('{}','#warnMsg','blue');".format(msg)
        originChannelLayer=cls.getOriginChannelLayer()
        originChannelLayer.send(channelName, {
            "text": json.dumps(cls.makeSuccessMsg(jsCodes.replace('\n','\\n'),targetUrl=targetUrl)),#发送给客户端的消息里不能包含换行符，所以这里转义一下
        })

    @classmethod
    def getOriginChannelLayer(cls):
        """
        获取self.message.channel_layer.channel_layer
        """
        return Group(cls.getRoomName()).channel_layer#方法1

    @classmethod
    def getRoomName(cls):
        #注意房间号可能会随BaseWebsocket.connection_groups变动而需要手工修改
        return 'DWD_'+MyUtil.getProjectName()+'_my_websocket'

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
        #下面的字段为兼容客户端老数据个
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
