'''
Created on Jul 1, 2017

@author: xiaoxi
'''

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

    #登录拦截
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
        jsFileBaseChmExtBg = '{}/js/chm-ext/base/BaseChmExtBg.js'.format(MyUtil.getDWSClientDir())
        jsFileBaseChmExtFt = '{}/js/chm-ext/base/BaseChmExtFt.js'.format(MyUtil.getDWSClientDir())
        jsFileDwsChmBbExt = '{}/js/chm-ext/DwsChmExtBg.js'.format(MyUtil.getDWSClientDir())
        jsFileDwsChmFtExt = '{}/js/chm-ext/DwsChmExtFt.js'.format(MyUtil.getDWSClientDir())
        jsFileWebSocket = '{}/js/chm-ext/DwsWebSocket.js'.format(MyUtil.getDWSClientDir())
        fileContent = MyUtil.readFileToStr(jsFileBaseChmExtBg, True)+MyUtil.readFileToStr(jsFileBaseChmExtFt, True)
        fileContent += MyUtil.readFileToStr(jsFileWebSocket, True)#提到前面引入
        fileContent += MyUtil.readFileToStr(jsFileDwsChmBbExt, True)
        fileContent += MyUtil.readFileToStr(jsFileDwsChmFtExt, True)
        return HttpResponse(fileContent)
