'''
Created on 2019年04月18日

@author: xiaoxi
'''
import os
import platform


class InitUtil:
    @classmethod
    def initCheck(cls):
        logDir=cls.getProjectLogDir()
        dataDir=cls.getProjectDataDir()
        if not cls.isFilePathExisted(logDir):
            print('auto create logs dir:'+logDir)
            os.makedirs(logDir)
        if not cls.isFilePathExisted(dataDir):
            print('auto create datas dir:'+dataDir)
            os.makedirs(dataDir)

    @classmethod
    def getDWSRootDir(cls):
        return  os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    @classmethod
    def getDWSClientDir(cls):
        return os.path.join(cls.getDWSRootDir(), 'client')

    @classmethod
    def getProjectRootDir(cls):
        return  os.path.abspath(os.path.join(os.path.dirname(cls.getDWSRootDir()), '.'))

    @classmethod
    def getProjectLogDir(cls):
        return  os.path.abspath(os.path.join(cls.getProjectRootDir(), 'logs'))

    @classmethod
    def getProjectDataDir(cls):
        return  os.path.abspath(os.path.join(cls.getProjectRootDir(), 'datas'))

    @classmethod
    def getDIRECTORY_SEPARATOR(cls):
        return '\\' if cls.isCurWindowsSystem() else '/'

    @classmethod
    def isFilePathExisted(cls,filePath):
        return os.path.exists(filePath)


    @classmethod
    def getOsName(cls):
        return platform.system()

    @classmethod
    def isCurWindowsSystem(cls):
        return 'indow' in cls.getOsName()
