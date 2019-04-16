'''
Created on 2019-04-16

@author: xiaoxi
'''
import json

from django.conf import settings
from django.http.response import HttpResponse

from ..common.OnlineUsers import OnlineUsers
from ..common.store.StoreService import StoreService
from .BaseHttpAction import BaseHttpAction
from ..util.CacheUtil import CacheUtil
from ..util.MyUtil import MyUtil
from ..websocket.WebsocketUtil import WebsocketUtil

class DwsGm(BaseHttpAction):
    '''
    辅助页面
    '''

    def __init__(self):
        '''
        Constructor
        '''
    #重写基类方法，判断只有超级管理员才能进入
    def getActionName(self):
        # 默认仅对管理员开放
        if not self.request.user.is_superuser:
            MyUtil.logInfo('无权访问({}),请不要恶意攻击，系统会记录你的IP:'.format(self.request.user.username))
            return ''
        return super().getActionName()


    def clearRedisCache(self,request):
        StoreService.getStoreCls().clearAll(MyUtil.REDIS_ONLINE_USERS)
        StoreService.getStoreCls().clearAll(MyUtil.REDIS_STORE)
        StoreService.getStoreCls().clearAll(MyUtil.REDIS_CHECK_DUP_KEY_VALUE)
        return HttpResponse('缓存清理成功!')

    def delCacheByKey(self, request):
        key = request.GET.get('key')
        if not (key and isinstance(key,str)):
            return HttpResponse('参数错误')
        key=key.strip()
        retData = {
            # 'isOk': CacheUtil.delete(key)
            'isOk': CacheUtil.deleteByKeyPrefix(key)
        }
        return HttpResponse(json.dumps(retData))

    def confDebugModel(self, request):
        settings.DEBUG = True
        retData={'ret':False,'type':'set'}
        enable = request.GET.get('enable')
        enable = enable if ('Y'==enable or 'N'==enable) else None
        if enable is None:
            retData['type']='get'
            retData['ret']=settings.DEBUG
        else:
            settings.DEBUG=True if 'Y'==enable else False
        return HttpResponse(json.dumps(retData))

    def confJsFileCache(self, request):
        retData={'ret':False,'type':'set'}
        enable = request.GET.get('enable')
        enable = enable if ('Y'==enable or 'N'==enable) else None
        if enable is None:
            retData['type']='get'
            retData['ret']=MyUtil.getJsFileCacheStatus()
        else:
            retData['ret']=MyUtil.setJsFileCacheStatus(enable)
        return HttpResponse(json.dumps(retData))

    def getOnlineUsers(self, request):
        userName = request.GET.get('userName')
        clientUrl = request.GET.get('clientUrl')
        clientIp = request.GET.get('clientIp')
        clientAgent = request.GET.get('clientAgent')
        groupByField = request.GET.get('groupByField')
        groupByField= 'userName' if not groupByField else groupByField
        findOnlineUsers = OnlineUsers.findUsers(groupByField=groupByField,userName=userName,clientIp=clientIp,clientUrlLike=clientUrl,clientAgentLike=clientAgent)
        if not findOnlineUsers:
            return HttpResponse('未找到该用户，可能用户已下线...')
        return HttpResponse(json.dumps(findOnlineUsers))

    def sendJsCodeToClient(self, request):
        jsCode = request.GET.get('jsCode')
        username = request.GET.get('username')
        clientUrl = request.GET.get('clientUrl')
        clientIp = request.GET.get('clientIp')
        findOnlineUsers = OnlineUsers.findUsers(userName=username,clientUrlLike=clientUrl,clientIp=clientIp)
        if not findOnlineUsers:
            return HttpResponse('未找到该用户，可能用户已下线...')
        if not jsCode:
            return HttpResponse('jsCode不能为空...')
        elif not ';' in jsCode:
            jsCode+=';'
        for eachOnlineUser in findOnlineUsers:
            MyUtil.logInfo('用户:{},channel_id:{},客户端url:{},客户端ip:{},下达jsCode:{}'.format(eachOnlineUser['userName'],eachOnlineUser['wsChannelId'],eachOnlineUser['clientUrl'],eachOnlineUser['clientIp'],jsCode))
            WebsocketUtil.sendSucMsgToOne(eachOnlineUser['wsChannelId'],jsCode,targetUrl=eachOnlineUser['clientUrl'])
        return HttpResponse(json.dumps(findOnlineUsers))


    def kickClient(self, request):
        noticeMsg= request.GET.get('noticeMsg')
        username = request.GET.get('username')
        clientUrl = request.GET.get('clientUrl')
        clientIp = request.GET.get('clientIp')
        findOnlineUsers = OnlineUsers.findUsers(userName=username,clientUrlLike=clientUrl,clientIp=clientIp)
        if not findOnlineUsers:
            return HttpResponse('未找到该用户，可能用户已下线...')
        if not noticeMsg:
            noticeMsg='你已被管理员强制剔除下线，如果疑问，请联系管理员!'
        jsCode="confirm('{}');myUtils.redirectUrl('/{}/User/logout');".format(noticeMsg,MyUtil.getProjectName())
        # jsCode="confirm('{}');".format(noticeMsg)
        for eachOnlineUser in findOnlineUsers:
            MyUtil.logInfo('用户:{},channel_id:{},客户端url:{},客户端ip:{},踢出下线:{}'.format(eachOnlineUser['userName'],eachOnlineUser['wsChannelId'],eachOnlineUser['clientUrl'],eachOnlineUser['clientIp'],jsCode))
            WebsocketUtil.sendSucMsgToOne(eachOnlineUser['wsChannelId'],jsCode,targetUrl=eachOnlineUser['tradeUrl'] if 'tradeUrl' in eachOnlineUser else '')
        return HttpResponse(json.dumps({'findUsers':findOnlineUsers}))

    @classmethod
    def getDefaultRouteConf(cls):
        from django.conf.urls import url
        return url(r'^{}/DwsGm/'.format(MyUtil.getProjectName()), cls.as_view(), name='dwsGmIndex')

    def test(self, request):
        1/0
        return HttpResponse('test')
