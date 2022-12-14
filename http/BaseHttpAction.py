'''
Created on Jul 1, 2017

@author: xiaoxi
'''
from django.http.response import HttpResponseNotFound
from django.views.decorators.cache import never_cache
from django.views.generic.base import View
from django.shortcuts import render
from ..util.MyUtil import MyUtil
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator


class BaseHttpAction(View):
    '''
    辅助页面BaseHttpAction
    '''
    __actionName = None  # 定义出来，为防止下面self.__actionName首次访问报错

    # 登录拦截
    @method_decorator(login_required)
    @never_cache
    def get(self, request, *args, **kwargs):
        # methodName=self.getActionName()
        methodName = self.getMethodName()
        if not getattr(self, methodName, None):
            return HttpResponseNotFound('<h1>Page not found2</h1>')
        return getattr(self, methodName)(request)

    # 登录拦截
    @method_decorator(login_required)
    def post(self, request, *args, **kwargs):
        return getattr(self, self.getMethodName())(request)

    def getActionName(self):
        return self.getMethodName()

    def getMethodName(self):
        pathInfo = self.request.path[:-1] if self.request.path.endswith('/') else self.request.path
        params = pathInfo.split('/')
        if len(params) < 1:
            self.__actionName = ''
        else:
            self.__actionName = params[-1]
        return self.__actionName

    def getDefaultTplName(self):
        return '{}/{}.html'.format(MyUtil.getClassSimpleName(self), self.__actionName)

    def geDefaultRender(self, context=None):
        response = render(self.request, self.getDefaultTplName(), context)
        #         return HttpResponse(htmlStr)
        # 添加header头，让客geDefaultRender户端支持跨域
        # response['Access-Control-Allow-origin'] = '*'
        # response['Access-Control-Allow-origin'] = '*'
        # response['Access-Control-Allow-Credentials:'] = 'True'
        # response['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
        return response
