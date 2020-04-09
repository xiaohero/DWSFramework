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
        if not getattr(self, self.getActionName(), None):
            return HttpResponseNotFound('<h1>Page not found2</h1>')
        return getattr(self, self.getActionName())(request)

    # 登录拦截
    @method_decorator(login_required)
    def post(self, request, *args, **kwargs):
        return getattr(self, self.getActionName())(request)

    def getActionName(self):
        # print('path:'+self.request.path)
        # print('replace:/{}/{}/'.format(MyUtil.getProjectName(), MyUtil.getClassSimpleName(self)))
        self.__actionName = self.__actionName if self.__actionName else self.request.path.replace(
            '/{}/{}/'.format(MyUtil.getProjectName(), MyUtil.getClassSimpleName(self).replace('Action', '')),
            '').replace('/', '')
        # print('__actionName:'+self.__actionName)
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
