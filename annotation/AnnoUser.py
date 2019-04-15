'''
Created on 2017年7月3日

@author: xiaoxi
'''
import functools
import json
from ..util.WebsocketUtil import WebsocketUtil
from channels.auth import  http_session_user,channel_and_http_session_user_from_http
from ..util.MyUtil import MyUtil

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
            brwClientIp=''
            if 'client' in message.content:
                brwClientIp=message.content['client'][0]
            #print('当前channel:{} 是否登录:{} 用户名:{} uid:{},ip:{}'.format(message.channel.name,message.user.is_authenticated,message.user.username,message.reply_channel,brwClientIp))
            #本地测试获取session部分特殊处理,鉴于chrome扩展后台http请求本地ip不带cookie，无法提取登录用户信息
            needSkipCheck= True if ('127.0.0.1'==brwClientIp and 'chrome-extension://' in str(message.content)) else False
            if not needSkipCheck and 'clientInfo' in message.channel_session:
                needSkipCheck= True if '127.0.0.1'==message.channel_session['clientInfo']['ip'][0] else False
            loginErr=None
            if not message.user.is_authenticated:
                loginErr='请先登录!'
            elif not message.user.is_active:
                loginErr='用户未激活，请联系管理员激活!'
            if loginErr:
                if needSkipCheck and not MyUtil.isCurWindowsSystem():
                    print('warn:{},消息:{},是否登录:{},是否激活:{},用户名:{},uid:{},ip:{}'.format('本地chrome后台环境测试,临时跳过登录验证',message.channel.name,message.user.is_authenticated,message.user.is_active,message.user.username,message.reply_channel, brwClientIp))
                else:
                    MyUtil.logInfo('error:{},消息:{},是否登录:{},是否激活:{},用户名:{},uid:{},ip:{}'.format(loginErr, message.channel.name,message.user.is_authenticated,message.user.is_active,message.user.username, message.reply_channel, brwClientIp))
                    # 踢掉未登录客户端
                    loginErr = {
                        'text': json.dumps(WebsocketUtil.makeErrMsg(loginErr))
                    }
                    message.reply_channel.send(loginErr)
                    # 临时屏蔽
                    message.reply_channel.send({'close': True})
            #still return whenever check is ok
            return func(*args, **kw)
        return wrapper