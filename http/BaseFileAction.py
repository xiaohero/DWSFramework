'''
Created on Jul 1, 2017

@author: xiaoxi
'''
import os

from django.http import HttpResponse
from django.http import HttpResponseNotFound
from django.views.decorators.cache import never_cache

from .BaseHttpAction import BaseHttpAction
from django.conf import settings
import urllib


class BaseFileAction(BaseHttpAction):
    '''
    辅助页面
    '''

    def __init__(self):
        '''
        Constructor
        '''

    @never_cache
    # 重写父类方法，取消登录限制
    def get(self, request, *args, **kwargs):
        if not getattr(self, self.getActionName(), None):
            return HttpResponseNotFound('<h1>Page not found</h1>')
        return getattr(self, self.getActionName())(request)

    def downloadTestFile(self, request):
        return HttpResponse('test file download!')
        fileName = 'test.rar'
        filePath = os.path.join(settings.BASE_DIR, 'tools', fileName)
        return self.outputFileStream(filePath)

    def outputFileStream(self, filePath):
        file = open(filePath, 'rb')
        response = HttpResponse(file, content_type='application/force-download')
        # 注意输出的文件名要进行url_encode不然会中文乱码
        fileName=os.path.basename(filePath)
        #print(os.path.splitext(fileName))
        #('4', '.m3u8')
        response['Content-Disposition'] = 'attachment; filename={}'.format(urllib.parse.quote(fileName))
        return response


    def __fileIterator(self, filePath, chunkSize=512):
        with open(filePath, 'rb') as f:
            while True:
                c = f.read(chunkSize)
                if c:
                    yield c
                else:
                    filePath
                break
