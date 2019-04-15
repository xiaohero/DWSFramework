'''
Created on Jul 1, 2017

@author: xiaoxi
'''
from DWSFramework.common.JsResource import JsResource
from ..util.MyUtil import MyUtil
from .BaseHttpAction import BaseHttpAction
from django.http.response import HttpResponse
from django.views.decorators.cache import never_cache
from django.http.response import  HttpResponseNotFound



class Res(BaseHttpAction):
    '''
    辅助页面
    '''

    def __init__(self):
        '''
        Constructor
        '''

    #取消登录拦截
    @never_cache
    def get(self, request, *args, **kwargs):
        if not getattr(self, self.getActionName(),None):
            return HttpResponseNotFound('<h1>Page not found</h1>')
        return getattr(self, self.getActionName())(request)

    #chrome插件后台核心入口,代码由服务器下发,方便热更
    def getDwsChromeExtJs(self, request):
        version = request.GET.get('version')
        if not version:
            version='latest'
        return HttpResponse(JsResource.getChmExtJsContents(version))
