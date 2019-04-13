'''
Created on 2017年6月22日

@author: xiaoxi
'''
import os
from datetime import datetime
import logging
from pprint import pprint, pformat
import importlib
import json
from collections import namedtuple
from pathlib import Path
from django.conf import settings
import hashlib
from .CacheUtil import CacheUtil
import subprocess

if not getattr(settings,'PROJECT_NAME',None):
    print('settings.PROJECT_NAME must be defined(settings配置文件必须定义工程名属性:PROJECT_NAME)')
    exit(0)
logger = logging.getLogger(settings.PROJECT_NAME + '.log.file')
    
class MyUtil:
    #全局缓存器
    __caches={}
    #用作存储
    REDIS_STORE='REDIS_{}:STORE'.format(settings.PROJECT_NAME)
    #重复值检测key前缀
    REDIS_CHECK_DUP_KEY_VALUE='REDIS_{}:CHECK_DUP_KEY_VALUE'.format(settings.PROJECT_NAME)
    #是否开启js缓存
    REDIS_JS_FILE_CACHE='REDIS_{}:JS_FILE_CACHE'.format(settings.PROJECT_NAME)

    def __init__(self):
        # print('MyUtil __init__')
        pass
    
    
    @classmethod
    def recordRequest(cls, request:object) -> None:
        #调试类日志默认日志等级关闭的
        cls.logInstance().debug('记录客户端request参数:{}'.format(pformat(vars(request))))
    
    @classmethod
    def getClassFullName(cls, obj:object) -> str:
        module = obj.__class__.__module__
        if module is None or module == str.__class__.__module__:
            return obj.__class__.__name__
        return module + '.' + obj.__class__.__name__
    
    @classmethod
    def logDebug(cls, msg:str) -> None:
        logger.debug(msg)

    @classmethod
    def logInfo(cls, msg:str) -> None:
        logger.info(msg)

    @classmethod
    def logWarning(cls, msg:str) -> None:
        logger.warning(msg)
    
    @classmethod
    def logError(cls, msg:str) -> None:
        logger.error(msg)
    
    @classmethod
    def logCritical(cls, msg:str) -> None:
        logger.critical(msg)
    
    @classmethod
    def logException(cls, msg:str) -> None:
        logger.exception(msg)   
    
    @classmethod
    def logPrint(cls, msg:str) -> None:
        pprint('{}-输出-{}'.format(datetime.utcnow(),msg))
    
    @classmethod
    def logObjInfo(cls, msg:object) -> None:
        if getattr(msg, '__dict__',0):
            logger.info(pformat(vars(msg)))
        else:
            logger.info(pformat(msg))
    
    @classmethod
    def logInstance(cls):
        return logger

    @classmethod
    def getClassByStrName(cls,strModuleName,strClasName):
        module = importlib.import_module(strModuleName)
        findCls = getattr(module, strClasName,None)
        return findCls

    @classmethod
    def getClassMethodByStrName(cls, targetCls, strMethodName):
        findMethod=getattr(targetCls, strMethodName,None)
        return findMethod if callable(findMethod) else None
    
    @classmethod
    def jsonToObject(cls, jsonStr):
        obj=lambda:None
        obj.__dict__=json.loads(jsonStr)
        #obj = json.loads(jsonStr, object_hook=lambda d: Namespace(**d))
        return obj
    @classmethod
    def jsonToObject2(cls, jsonStr,className='DynObject'):
        obj=json.loads(jsonStr, object_hook=lambda d: namedtuple(className, d.keys())(*d.values()))
        return obj

    '''新语法特性
    @classmethod
    def jsonToObject3(cls, jsonStr,objCls):
        annotations: dict = objCls.__annotations__ if hasattr(objCls, '__annotations__') else None
        if issubclass(objCls, List):
            list_type = objCls.__args__[0]
            instance: list = list()
            for value in jsonStr:
                instance.append(cls.jsonToObject3(value, list_type))
            return instance
        elif issubclass(objCls, Dict):
            key_type = objCls.__args__[0]
            val_type = objCls.__args__[1]
            instance: dict = dict()
            for key, value in jsonStr.items():
                instance.update(cls.jsonToObject3(key, key_type), cls.jsonToObject3(value, val_type))
            return instance
        else:
            instance: objCls = objCls()
            for name, value in jsonStr.items():
                field_type = annotations.get(name)
                if inspect.isclass(field_type) and isinstance(value, (dict, tuple, list, set, frozenset)):
                    setattr(instance, name, cls.jsonToObject3(value, field_type))
                else:
                    setattr(instance, name, value)
            return instance
    '''


    @classmethod
    def readFileToStr(cls, filePath, noCache=False):
        '''
        :param filePath:
        :param getFromCache:
        :return:
        '''
        isOnlineEnv=MyUtil.isOnlineEnv()
        oldPath=filePath
        newPath=filePath.replace('.js', '_Protected.js')
        #线上代码混淆后新文件名
        if not ('third-party' in filePath or 'AjaxUtil' in filePath or 'ChmExtFtUtil' in filePath) and isOnlineEnv and '.js' in filePath:
            filePath = newPath
        enableJsFileCache= (True if 'Y'==CacheUtil.get(cls.REDIS_JS_FILE_CACHE) else False)
        # 线上默认开启文件缓存
        if filePath in cls.__caches and enableJsFileCache:
            return cls.__caches[filePath]
        #判断是否需要混淆
        if newPath==filePath:
            #执行代码混淆，生成新文件
            exeResult = subprocess.call([
                'javascript-obfuscator',
                oldPath,
                '--output',
                newPath
            ])
        path=Path(filePath)
        if False and getattr(path,'read_text',None):
            data=Path(filePath).read_text('utf-8')
        else:#兼容非python3.6环境
            with open(filePath, 'r',encoding='utf-8') as myFile:
                data = myFile.read()
        #全局缓存
        cls.__caches[filePath]=data
        return data

    @classmethod
    def getProjectName(cls):
        return settings.PROJECT_NAME

    @classmethod
    def getClassSimpleName(cls, obj):
        return obj.__class__.__name__

    @classmethod
    def decodeDictBytesToDict2(cls,data):
        data_type = type(data)
        if data_type == bytes:
            return data.decode()
        if data_type in (str, int):
            return str(data)
        if data_type == dict:
            data = data.items()
        return data_type(map(cls.decodeDictBytesToDict2, data))

    @classmethod
    def isfloat(cls,value):
        try:
            float(value)
            return True
        except ValueError:
            return False

    @classmethod
    def forceToFloat(cls, value):
        try:
            fValue=float(value)
            return fValue
        except ValueError:
            return 0

    @classmethod
    def isJson(cls,str):
        try:
            jsonObj = json.loads(str)
        except ValueError as e:
            return False
        return True


    @classmethod
    def getLocalIp(cls):
        return settings.LOCAL_IP

    @classmethod
    def isOnlineEnv(cls):
        return settings.IS_ONLINE_ENV

    @classmethod
    def getDjClientIp(cls,request):
        xForwardedFor = request.META.get('HTTP_X_FORWARDED_FOR')
        if xForwardedFor:
            ip = xForwardedFor.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @classmethod
    def md5(cls,strValue):
        m = hashlib.md5()
        m.update(strValue.encode('utf-8'))
        return m.hexdigest()

    @classmethod
    def checkDuplicate(cls,key,value):
        cacheKey='{}:{}'.format('REDIS_{}:CHECK_DUP_KEY_VALUE'.format(settings.PROJECT_NAME),key)
        oldValue=CacheUtil.get(cacheKey)
        if value==oldValue:
            return True
        CacheUtil.set(cacheKey, value)
        return  False

    @classmethod
    def getDuplicateCheckOldValue(cls,key):
        cacheKey='{}:{}'.format(cls.REDIS_CHECK_DUP_KEY_VALUE,key)
        oldValue=CacheUtil.get(cacheKey)
        return  oldValue

    @classmethod
    def getDictSortOne(cls,varDict,sortKey,reverse=False):
        retDict=sorted(varDict.items(), key=lambda d: float(d[1][sortKey]),reverse=reverse)
        return retDict[0]

    @classmethod
    def getDictSort(cls,varDict,sortKey,reverse=False):
        retDict=sorted(varDict.items(), key=lambda d: float(d[1][sortKey]),reverse=reverse)
        return retDict

    @classmethod
    def getJsFileCacheStatus(cls):
        return True if 'Y'==CacheUtil.get(cls.REDIS_JS_FILE_CACHE) else False

    @classmethod
    def setJsFileCacheStatus(cls,enable):
        return CacheUtil.set(cls.REDIS_JS_FILE_CACHE, enable)

    @classmethod
    def getDWSRootDir(cls):
        return  os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    @classmethod
    def getDWSClientDir(cls):
        return os.path.join(cls.getDWSRootDir(), 'client')
