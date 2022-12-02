'''
Created on 2017年6月22日

@author: xiaoxi
'''
from datetime import datetime
import logging
from inspect import stack
from pprint import pprint, pformat
import importlib
import json
from collections import namedtuple
from pathlib import Path
from django.conf import settings
import hashlib

from .InitUtil import InitUtil
from .CacheUtil import CacheUtil
from .CacheObjectUtil import CacheObjectUtil
import subprocess
import time

logger = logging.getLogger(settings.PROJECT_NAME + '.log.file')


class MyUtil:
    # 全局缓存器
    __caches = {}
    # 用作存储
    REDIS_STORE = 'REDIS_DWS:STORE'
    # 重复值检测key前缀
    REDIS_CHECK_DUP_KEY_VALUE = 'REDIS_DWS:CHECK_DUP_KEY_VALUE'
    # 是否开启js缓存
    REDIS_JS_FILE_CACHE = 'REDIS_DWS:JS_FILE_CACHE'
    # 在线用户redis key
    REDIS_ONLINE_USERS = 'REDIS_DWS:ONLINE_USERS'
    # 公共DB缓存
    REDIS_COMMON_CACHE = 'REDIS_DWS:DB'

    def __init__(self):
        # print('MyUtil __init__')
        pass

    @classmethod
    def recordRequest(cls, request: object) -> None:
        # 调试类日志默认日志等级关闭的
        cls.logInstance().debug('记录客户端request参数:{}'.format(pformat(vars(request))))

    @classmethod
    def getClassFullName(cls, obj: object) -> str:
        module = obj.__class__.__module__
        if module is None or module == str.__class__.__module__:
            return obj.__class__.__name__
        return module + '.' + obj.__class__.__name__

    @classmethod
    def logDebug(cls, msg: str) -> None:
        logger.debug(msg)

    @classmethod
    def logInfo(cls, msg: str) -> None:
        logger.info(msg)

    @classmethod
    def logWarning(cls, msg: str) -> None:
        logger.warning(msg)

    @classmethod
    def logError(cls, msg: str) -> None:
        logger.error(msg)

    @classmethod
    def logCritical(cls, msg: str) -> None:
        logger.critical(msg)

    @classmethod
    def logException(cls, msg: str) -> None:
        logger.exception(msg)

    @classmethod
    def logPrint(cls, msg: str) -> None:
        pprint('{}-输出-{}'.format(datetime.utcnow(), msg))

    @classmethod
    def logObjInfo(cls, msg: object) -> None:
        if getattr(msg, '__dict__', 0):
            logger.info(pformat(vars(msg)))
        else:
            logger.info(pformat(msg))

    @classmethod
    def logInstance(cls):
        return logger

    @classmethod
    def getClassByStrName(cls, strModuleName, strClasName):
        moduleExisted = True if importlib.util.find_spec(strModuleName) is not None else False
        if not moduleExisted:
            return False
        module = importlib.import_module(strModuleName)
        findCls = getattr(module, strClasName, None)
        return findCls

    @classmethod
    def getClassMethodByStrName(cls, targetCls, strMethodName):
        findMethod = getattr(targetCls, strMethodName, None)
        return findMethod if callable(findMethod) else None

    @classmethod
    def jsonToObject(cls, jsonStr):
        obj = lambda: None
        obj.__dict__ = json.loads(jsonStr)
        # obj = json.loads(jsonStr, object_hook=lambda d: Namespace(**d))
        return obj

    @classmethod
    def jsonToObject2(cls, jsonStr, className='DynObject'):
        obj = json.loads(jsonStr, object_hook=lambda d: namedtuple(className, d.keys())(*d.values()))
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
    def readFileToStr(cls, filePath, noCache=False, appenDemicolon=True, needObf=False):
        '''
        :param filePath:
        :param getFromCache:
        :return:
        '''
        oldPath = filePath
        newPath = filePath.replace('.js', '_Protected.js')
        #测试用
        #needObf=False
        # 线上代码混淆后新文件名readFileToStr
        if needObf and '.js' in filePath:
            filePath = newPath
        enableJsFileCache = (True if 'Y' == CacheUtil.get(cls.REDIS_JS_FILE_CACHE) else False)
        # 线上默认开启文件缓存
        if filePath in cls.__caches and enableJsFileCache:
            return cls.__caches[filePath]
        # 判断是否需要混淆
        if newPath == filePath:
            # 执行代码混淆，生成新文件
            exeResult = subprocess.call([
                'javascript-obfuscator',
                oldPath,
                '--output',
                newPath
            ])
        if False and getattr(Path(filePath), 'read_text', None):
            data = Path(filePath).read_text('utf-8')
        else:  # 兼容非python3.6环境
            with open(filePath, 'r', encoding='utf-8') as myFile:
                data = myFile.read()
        # 全局缓存
        data = (data + ';') if (appenDemicolon and data) else data
        cls.__caches[filePath] = data
        return data

    @classmethod
    def readFileToStrOld(cls, filePath, noCache=False, appenDemicolon=True):
        '''
        :param filePath:
        :param getFromCache:
        :return:
        '''
        isOnlineEnv = MyUtil.isOnlineEnv()
        oldPath = filePath
        newPath = filePath.replace('.js', '_Protected.js')
        # 线上代码混淆后新文件名readFileToStr
        if not ('third-party' in filePath) and isOnlineEnv and '.js' in filePath:
            filePath = newPath
        enableJsFileCache = (True if 'Y' == CacheUtil.get(cls.REDIS_JS_FILE_CACHE) else False)
        # 线上默认开启文件缓存
        if filePath in cls.__caches and enableJsFileCache:
            return cls.__caches[filePath]
        # 判断是否需要混淆
        if newPath == filePath:
            # 执行代码混淆，生成新文件
            exeResult = subprocess.call([
                'javascript-obfuscator',
                oldPath,
                '--output',
                newPath
            ])
        if False and getattr(Path(filePath), 'read_text', None):
            data = Path(filePath).read_text('utf-8')
        else:  # 兼容非python3.6环境
            with open(filePath, 'r', encoding='utf-8') as myFile:
                data = myFile.read()
        # 全局缓存
        data = (data + ';') if (appenDemicolon and data) else data
        cls.__caches[filePath] = data
        return data

    @classmethod
    def getProjectName(cls):
        if 'upPrjName' in cls.__caches and cls.__caches['upPrjName']:
            return cls.__caches['upPrjName']
        prjRootDirList = cls.getProjectRootDir().split(cls.getDIRECTORY_SEPARATOR())
        upPrjName = prjRootDirList[-1] if len(prjRootDirList) > 1 else ''
        cls.__caches['upPrjName'] = upPrjName
        return upPrjName
        # return settings.PROJECT_NAME

    @classmethod
    def getWsRoomName(cls):
        return 'ROOM_DWS_{}'.format(cls.getProjectName())

    @classmethod
    def getFrameworkName(cls):
        if 'fwPrjName' in cls.__caches:
            return cls.__caches['fwPrjName']
        fwPrjRootDirList = cls.getDWSRootDir().split(cls.getDIRECTORY_SEPARATOR())
        fwPrjName = fwPrjRootDirList[-1] if len(fwPrjRootDirList) > 1 else ''
        cls.__caches['fwPrjName'] = fwPrjName
        return fwPrjName

    @classmethod
    def getClassSimpleName(cls, obj):
        return obj.__class__.__name__

    @classmethod
    def decodeDictBytesToDict2(cls, data):
        data_type = type(data)
        if data_type == bytes:
            return data.decode()
        if data_type in (str, int):
            return str(data)
        if data_type == dict:
            data = data.items()
        return data_type(map(cls.decodeDictBytesToDict2, data))

    @classmethod
    def isfloat(cls, value):
        try:
            float(value)
            return True
        except ValueError:
            return False

    @classmethod
    def forceToFloat(cls, value):
        try:
            fValue = float(value)
            return fValue
        except ValueError:
            return 0

    @classmethod
    def isJson(cls, str):
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
    def getDjClientIp(cls, request):
        xForwardedFor = request.META.get('HTTP_X_FORWARDED_FOR')
        if xForwardedFor:
            ip = xForwardedFor.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @classmethod
    def md5(cls, strValue):
        m = hashlib.md5()
        m.update(strValue.encode('utf-8'))
        return m.hexdigest()

    @classmethod
    def checkDuplicate(cls, key, value):
        cacheKey = '{}:{}'.format('REDIS_{}:CHECK_DUP_KEY_VALUE'.format(settings.PROJECT_NAME), key)
        oldValue = CacheUtil.get(cacheKey)
        if value == oldValue:
            return True
        CacheUtil.set(cacheKey, value)
        return False

    @classmethod
    def getDuplicateCheckOldValue(cls, key):
        cacheKey = '{}:{}'.format(cls.REDIS_CHECK_DUP_KEY_VALUE, key)
        oldValue = CacheUtil.get(cacheKey)
        return oldValue

    @classmethod
    def getDictSortOne(cls, varDict, sortKey, reverse=False):
        retDict = sorted(varDict.items(), key=lambda d: float(d[1][sortKey]), reverse=reverse)
        return retDict[0]

    @classmethod
    def getDictSort(cls, varDict, sortKey, reverse=False):
        retDict = sorted(varDict.items(), key=lambda d: float(d[1][sortKey]), reverse=reverse)
        return retDict

    @classmethod
    def getJsFileCacheStatus(cls):
        return True if 'Y' == CacheUtil.get(cls.REDIS_JS_FILE_CACHE) else False

    @classmethod
    def setJsFileCacheStatus(cls, enable):
        return CacheUtil.set(cls.REDIS_JS_FILE_CACHE, enable)

    @classmethod
    def getDWSRootDir(cls):
        return InitUtil.getDWSRootDir()

    @classmethod
    def getDWSClientDir(cls):
        return InitUtil.getDWSClientDir()

    @classmethod
    def getProjectRootDir(cls):
        return InitUtil.getProjectRootDir()

    @classmethod
    def getProjectLogDir(cls):
        return InitUtil.getProjectLogDir()

    @classmethod
    def getProjectDataDir(cls):
        return InitUtil.getProjectDataDir()

    @classmethod
    def getOsName(cls):
        return InitUtil.getOsName()

    @classmethod
    def isCurWindowsSystem(cls):
        return InitUtil.isCurWindowsSystem()

    @classmethod
    def getDIRECTORY_SEPARATOR(cls):
        return InitUtil.getDIRECTORY_SEPARATOR()

    @classmethod
    def getProjectStaticDir(cls):
        return settings.STATICFILES_DIRS[0]
        # return os.path.abspath(os.path.join(cls.getProjectRootDir,'static'))

    @classmethod
    def isFilePathExisted(cls, filePath):
        return InitUtil.isFilePathExisted(filePath)

    @classmethod
    def dictRemoveEmptyItems(cls, oldDict):
        return {k: v for k, v in oldDict.items() if v}

    @classmethod
    def getCurDateTime(cls, format='%Y-%m-%d %H:%M:%S'):
        return datetime.now().strftime(format)

    @classmethod
    def convTimeToDateTime(cls, timeStamp, format='%Y-%m-%d %H:%M:%S'):
        return time.strftime(format, time.localtime(int(timeStamp)))

    @classmethod
    def convDateTimeToTime(cls, dateTime, format='%Y-%m-%d %H:%M:%S'):
        dateTime = str(dateTime)[:19]
        return int(time.mktime(time.strptime(dateTime, format)))

    @classmethod
    def getFromCache2DB(cls, makeInvokeFuncIfNot, *funcParams):
        enableDebug = False
        enableCache = False
        cacheKey = '{}:{}:{}'.format(cls.REDIS_COMMON_CACHE, cls.getProjectName(), stack()[1][3])
        for eachParam in funcParams:
            if not funcParams:
                return None
            cacheKey += ':' + str(eachParam)
        # print('cacheKey:'+cacheKey)
        if not cacheKey:
            return None
        if enableCache:
            cacheValue = CacheObjectUtil.get(cacheKey)
            if cacheValue:
                MyUtil.logInfo('缓存命中:cacheKey:{},cacheValue:{}'.format(cacheKey, cacheValue)) if enableDebug else False
                return cacheValue
        else:
            CacheObjectUtil.delete(cacheKey)
        cacheValue = makeInvokeFuncIfNot(funcParams)
        MyUtil.logInfo('DB命中:cacheKey:{},cacheValue:{}'.format(cacheKey, cacheValue)) if enableDebug else False
        CacheObjectUtil.set(cacheKey, cacheValue, 43200) if (enableCache and cacheValue) else False
        return cacheValue

    @classmethod
    def writeDataFile(cls, strMsg: str, targetFileName: str = '', outConsole: bool = False, logAddTime: bool = True,
                      overwrite=False):
        strMsg = str(strMsg)
        import os
        targetFileName = 'debug_default_{}.log'.format(
            MyUtil.getCurDateTime('%Y-%m-%d')) if not targetFileName else targetFileName
        targetFilePath = os.path.join(cls.getProjectDataDir(), targetFileName)
        if not os.path.exists(os.path.dirname(targetFilePath)):
            try:
                os.makedirs(os.path.dirname(targetFilePath))
            except OSError as e:
                import errno
                if e.errno != errno.EEXIST:
                    print('error:创建日志目录({}),失败:{}'.format(os.path.abspath(targetFilePath), e))
                    return
        with open(targetFilePath, 'w' if overwrite else 'a', encoding='utf-8') as out:
            out.write((MyUtil.getCurDateTime() + ':' if logAddTime else '') + strMsg + '\n')
        if outConsole:
            print(strMsg)
        return targetFilePath

    @classmethod
    def getCurServerIp(cls, innetAddr=False):
        if not cls.isOnlineEnv():
            return cls.getLocalIp() if innetAddr else '127.0.0.1'
        from .HttpUtil import HttpUtil
        ret = HttpUtil.get('http://ifconf.me')
        return ret.strip() if ret else ''
