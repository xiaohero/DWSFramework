'''
Created on 2019-04-16

@author: xiaoxi
'''
from ..util.HttpUtil import HttpUtil
from ..util.MyUtil import MyUtil
from .store.StoreService import StoreService
from datetime import datetime


class OnlineUsers:

    '''
    静态资源访问类
    '''

    def __init__(self):
        '''
        构造函数
        '''

    @classmethod
    def updateUser(cls,wsChannelId,wsPath,userName='',clientIp='',clientUrl='',clientAgent=''):
        if not wsChannelId:
            return False
        #临时处理，兼容未登陆用户,fixme:上线后可关闭此处,理论上connect前必须做登陆验证
        userName= 'guest' if not userName else userName
        #print('更新在线用户信息:wsChannelId:{},wsPath:{},userName:{},clientIp:{},clientUrl:{},clientAgent:{}'.format(wsChannelId,wsPath,userName,clientIp,clientUrl,clientAgent))
        # 字典去除空元素
        upDict=MyUtil.dictRemoveEmptyItems({
                'wsChannelId':wsChannelId,
                'wsPath': wsPath,
                'userName': userName,
                'clientIp': clientIp,
                'clientUrl': clientUrl,
                'clientAgent': clientAgent,
                'updateDateTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        })
        return StoreService.getStoreCls().save(MyUtil.REDIS_ONLINE_USERS, MyUtil.getProjectName(), userName,{
            wsChannelId: {
                'wsChannelId':wsChannelId,
                'wsPath': wsPath,
                'userName': userName,
                'clientIp': clientIp,
                'clientUrl': clientUrl,
                'clientAgent': clientAgent,
                'updateDateTime': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        },86400)


    @classmethod
    def findUsers(cls, wsChannelId='',wsPath='',userName='',clientIp='',clientUrlLike='',clientAgentLike='',groupByField=''):
        # 遍历其它币当前所有在线玩家
        retData = []
        if groupByField:
            # 按uid分组返回
            retData = {}
        #获取所有
        allUsers = StoreService.getStoreCls().getByKey1(MyUtil.REDIS_ONLINE_USERS,MyUtil.getProjectName())
        #print('allUsers:{}'.format(allUsers))
        #提高查询速度
        findOver=False
        for eachUserName, curUserList in allUsers.items():
            # 排除不匹配的用户名
            if userName:
                if eachUserName != userName:
                    continue
                findOver=True
            for eachChannelId, userInfo in curUserList.items():
                if wsChannelId and wsChannelId!=eachChannelId:
                    continue
                #print('{}=>{}=>{}'.format(eachUserName,eachChannelId, userInfo))
                # 对象存进去变json字符串了
                if isinstance(userInfo, str):
                    userInfo = eval(userInfo)
                # 各种过滤匹配
                if wsPath and wsPath!=userInfo['wsPath']:
                    continue
                if clientIp and clientIp!=userInfo['clientIp']:
                    continue
                if clientUrlLike and clientUrlLike not in userInfo['clientUrl']:
                    continue
                if clientAgentLike and clientAgentLike not in userInfo['clientAgent']:
                    continue
                if groupByField:
                    gbyField= HttpUtil.getDomainByUrl(userInfo['clientUrl'],True) if 'userName'!=groupByField else eachUserName
                    if not gbyField in retData:
                        retData[gbyField] = []
                    retData[gbyField].append(userInfo)
                else:
                    retData.append(userInfo)
                if wsChannelId:
                    break;
            if findOver:
                break
        return retData


    @classmethod
    def removeByChannelId(cls, wsChannelId):
        users=cls.findUsers(wsChannelId)
        # Redis中删除该记录,把要保存的值设置为空即可删除
        return StoreService.getStoreCls().save(MyUtil.REDIS_ONLINE_USERS, MyUtil.getProjectName(), users[0]['userName'], {
            wsChannelId: None
        }, 86400) if users else False

    @classmethod
    def removeByUserName(cls, userName):
        users=cls.findUsers(userName=userName)
        # 遍历其它币当前所有在线玩家
        delRet=[]
        # chm ext bg ws机制后需要遍历所有记录剔除
        for eachUser in users:
            delRet.append(StoreService.getStoreCls().save(MyUtil.REDIS_ONLINE_USERS, MyUtil.getProjectName(), eachUser['userName'], {
                eachUser['wsChannelId']: None
            }, 86400) if users else False)
        return delRet