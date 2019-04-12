'''
Created on 2017年7月3日

@author: xiaoxi
'''
import functools
from channels.sessions import channel_session
from util.MyUtil import MyUtil
from pprint import pformat
from django.core.cache import cache
from util.CacheUtil import CacheUtil

class AnnoUtil(object):
    '''
    自定义注解工具类
    '''
    def __init__(self, params):
        '''
        Constructor
        '''

    @classmethod
    def recordRequest(cls, func):
        '''
        自定义注解,所有request请求前置拦截
        '''
        @functools.wraps(func)
        def wrapper(*args, **kw):
            MyUtil.logDebug('记录客户端request参数:{}'.format(pformat(vars(*args))))
            return func(*args, **kw)
        return wrapper


    @classmethod
    def before_enforce_ordering(cls, func):
        '''
        特殊注解，为修复channels1.6及以下版本使用enforce_ordering注解的bug
        注意:channels 1.6.0及以下版本存在bug，永远进不去wsMessage，也木有任何报错，就是客户端收不到消息
        :param func:
        :return:
        '''
        @channel_session
        @functools.wraps(func)
        def wrapper(*args, **kw):
            # __channels_next_order默认值修正为1，以防wsMessage阻塞
            args[0].channel_session.setdefault('__channels_next_order', 1)
            return func(*args, **kw)
        return wrapper

    @classmethod
    #控制celery单任务运行,依赖django.core.cache
    def singleInstanceTask(cls,timeout=60):
        def task_exc(func):
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                lock_id = 'celery-single-instance-' + func.__name__
                acquire_lock = lambda: cache.add(lock_id, 'true', timeout)
                release_lock = lambda: cache.delete(lock_id)
                if acquire_lock():
                    try:
                        func(*args, **kwargs)
                    finally:
                        release_lock()
            return wrapper
        return task_exc

    @classmethod
    #控制celery单任务运行,依赖Redis
    def single_instance_task(cls,function=None, key='anno_redis_lock', timeout=None):
        '''Enforce only one celery task at a time.'''
        def _dec(run_func):
            '''Decorator.'''
            def _caller(*args, **kwargs):
                '''Caller.'''
                ret_value = None
                have_lock = False
                lock = CacheUtil.redisConnect.lock(key, timeout=timeout)
                try:
                    have_lock = lock.acquire(blocking=False)
                    if have_lock:
                        ret_value = run_func(*args, **kwargs)
                finally:
                    if have_lock:
                        lock.release()
                return ret_value
            return _caller
        return _dec(function) if function is not None else _dec
