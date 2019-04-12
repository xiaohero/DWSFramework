'''
Created on 2017年6月22日

@author: xiaoxi
'''

from django.conf import settings

class ConstUtil:
    #用作存储
    REDIS_STORE='REDIS_{}:STORE'.format(settings.Proje)
    #重复值检测key前缀
    REDIS_CHECK_DUP_KEY_VALUE='REDIS_{}:CHECK_DUP_KEY_VALUE'.format(settings.PROJECT_NAME)
    #是否推送客户端差价消息
    REDIS_JS_FILE_CACHE='REDIS_{}:JS_FILE_CACHE'.format(settings.PROJECT_NAME)


