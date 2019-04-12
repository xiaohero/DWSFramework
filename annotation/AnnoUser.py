'''
Created on 2017年7月3日

@author: xiaoxi
'''
import functools
import json
from ..util.WebsocketUtil import WebsocketUtil
from channels.auth import  http_session_user,channel_and_http_session_user_from_http

class AnnoUser(object):
    '''
    用户注解工具类
    '''
    def __init__(self, params):
        '''
        Constructor
        '''

    @classmethod
    def channelLoginRequiredAfterHandler(cls, func):
        '''
        特殊注解，channel登录拦截
        :param func:
        :return:
        '''
        @http_session_user #注意，这里加http_session_user保险点
        @functools.wraps(func)
        def wrapper(*args, **kw):
            message=args[0]
            # print('当前channel:{} 是否登录:{} 用户名:{} uid:{}'.format(message.channel.name,message.user.is_authenticated,message.user.username,message.reply_channel))
            if not message.user.is_authenticated:
                loginErr={
                    'text': json.dumps({'msg': '请先登录:'+message.channel.name}),
                }
                message.reply_channel.send(loginErr)
            else:
                return func(*args, **kw)
        return wrapper


    @classmethod
    def channelLoginRequiredBeforeHandler(cls, func):
        '''
        特殊注解，channel登录拦截
        :param func:
        :return:
        '''
        @channel_and_http_session_user_from_http
        @http_session_user
        @functools.wraps(func)
        def wrapper(*args, **kw):
            message=args[0]
            # print('当前channel:{} 是否登录:{} 用户名:{} uid:{}'.format(message.channel.name,message.user.is_authenticated,message.user.username,message.reply_channel))
            if not message.user.is_authenticated:
                loginErr={
                    'text': json.dumps({'msg': '请先登录:'+message.channel.name}),
                }
                message.reply_channel.send(loginErr)
            else:
                return func(*args, **kw)
        return wrapper
    
    @classmethod
    def channelLoginRequired(cls, func):
        '''
        特殊注解，channel登录拦截
        :param func:
        :return:
        '''
        def wrapper(*args, **kw):
            message=args[0]
            #print('当前channel:{} 是否登录:{} 用户名:{} uid:{}'.format(message.channel.name,message.user.is_authenticated,message.user.username,message.reply_channel))
            if not message.user.is_authenticated:
                loginErr={
                    'text': json.dumps(WebsocketUtil.makeErrMsg('请先登录!')),
                }
                message.reply_channel.send(loginErr)
                #断开客户端连接
                message.reply_channel.send({'close': True})
            elif not message.user.is_active:
                loginErr = {
                    'text': json.dumps(WebsocketUtil.makeErrMsg('用户未激活，请联系管理员激活!')),
                }
                message.reply_channel.send(loginErr)
                #断开客户端连接
                message.reply_channel.send({'close': True})
            else:
                return func(*args, **kw)
        return wrapper