'''
Created on 2019-04-16

@author: xiaoxi
'''
from DWSFramework.util.CacheUtil import CacheUtil
from ..util.HttpUtil import HttpUtil
from ..util.MyUtil import MyUtil
from .store.StoreService import StoreService


class OnlineUsers:

    '''
    静态资源访问类
    '''

    def __init__(self):
        '''
        构造函数
        '''

    @classmethod
    def updateUser(cls, wsChannelId: str, wsPath: str = '', userName: str = '', clientIp: str = '', clientUrl: str = '',clientAgent: str = ''):
        if not wsChannelId:
            return False
        #临时处理，兼容未登陆用户,fixme:上线后可关闭此处,理论上connect前必须做登陆验证
        userName= 'guest' if not userName else userName
        #print('更新在线用户信息:wsChannelId:{},wsPath:{},userName:{},clientIp:{},clientUrl:{},clientAgent:{}'.format(wsChannelId,wsPath,userName,clientIp,clientUrl,clientAgent))
        #agent单独再存一个key，以免被冲掉
        if clientAgent:
            CacheUtil.set('{}:{}:{}'.format(MyUtil.REDIS_ONLINE_USERS,userName,wsChannelId), clientAgent,86400)
        else:
            clientAgent = CacheUtil.get('{}:{}:{}'.format(MyUtil.REDIS_ONLINE_USERS, userName, wsChannelId))
        upDict={
                'wsChannelId':wsChannelId,
                'wsPath': wsPath,
                'userName': userName,
                'clientIp': clientIp,
                'clientUrl': clientUrl,
                'clientAgent': clientAgent if clientAgent else '',
                'updateDateTime': MyUtil.getCurDateTime()
        }
        return StoreService.getStoreCls().save(MyUtil.REDIS_ONLINE_USERS, MyUtil.getProjectName(), userName,{ wsChannelId: upDict },86400)


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
        if allUsers:
            for eachUserName, curUserList in allUsers.items():
                # 排除不匹配的用户名
                if userName:
                    if eachUserName != userName:
                        continue
                    findOver = True
                for eachChannelId, userInfo in curUserList.items():
                    if wsChannelId and wsChannelId != eachChannelId:
                        continue
                    # print('{}=>{}=>{}'.format(eachUserName,eachChannelId, userInfo))
                    # 对象存进去变json字符串了
                    if isinstance(userInfo, str):
                        userInfo = eval(userInfo)
                    # 各种过滤匹配
                    if wsPath and wsPath != userInfo['wsPath']:
                        continue
                    if clientIp and clientIp != userInfo['clientIp']:
                        continue
                    if clientUrlLike and clientUrlLike not in userInfo['clientUrl']:
                        continue
                    if clientAgentLike and clientAgentLike not in userInfo['clientAgent']:
                        continue
                    if groupByField:
                        gbyField = HttpUtil.getDomainByUrl(userInfo['clientUrl'],True) if 'userName' != groupByField else eachUserName
                        if not gbyField in retData:
                            retData[gbyField] = []
                        retData[gbyField].append(userInfo)
                    else:
                        retData.append(userInfo)
                    if wsChannelId:
                        break
                if findOver:
                    break
        return retData


    @classmethod
    def findOneUser(cls, wsChannelId='',wsPath='',userName='',clientIp='',clientUrlLike='',clientAgentLike='',groupByField=''):
        # 遍历其它币当前所有在线玩家
        retData = cls.findUsers(wsChannelId,wsPath,userName,clientIp,clientUrlLike,clientAgentLike,groupByField)
        return retData[0] if retData else None


    @classmethod
    def removeByChannelId(cls, wsChannelId):
        user=cls.findOneUser(wsChannelId)
        # Redis中删除该记录,把要保存的值设置为空即可删除
        return StoreService.getStoreCls().save(MyUtil.REDIS_ONLINE_USERS, MyUtil.getProjectName(), user['userName'], {wsChannelId: None}, 86400) if user else False

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