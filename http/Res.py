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

    def getDWsEnterJs(self, request, returnStrHtml=False):
        # 如果要开启内网模式，记得打开下面这行代码
        isInnetNet = False
        jsFileWebSocket = '{}/js/chm-ext/WebSocket.js'.format(MyUtil.getDWSClientDir())
        jsFileWsEnter = '{}/js/chm-ext/WsEnter.js'.format(MyUtil.getDWSClientDir())
        fileContent = ''
        fileContent += MyUtil.readFileToStr(jsFileWebSocket, True)
        fileContent += MyUtil.readFileToStr(jsFileWsEnter, True).replace(
            MyUtil.getServAddrByMainCoin('LOCAL', 'ws', 8000),
            MyUtil.getServAddrByMainCoin(
                MyUtil.getCurMainCoinCode(), 'ws', 8000))
        if isInnetNet:
            fileContent = fileContent.replace('127.0.0.1', MyUtil.getLocalIp())
        # 方案1，动态获取公网ip
        # 方案2,读取WsEnterOuter.js
        return HttpResponse(fileContent) if not returnStrHtml else fileContent


    def checkWsEnterGame(self, request):
        url = request.GET.get('url') if request.GET.get('url') else request.POST.get('url')
        byChmExt = request.GET.get('byChmExt') if request.GET.get('byChmExt') else request.POST.get('byChmExt')
        byChmExt = int(byChmExt) if byChmExt else 0
        MyUtil.logInfo('用户:{},当前所在页面:{}'.format(request.user, url))
        # 过滤coinsGatherUrl非空数据
        # 注意学习下面的非空过滤写法
        if not url:
            return HttpResponse('console.log("参数错误,跳过:{}")'.format(url))
        url = url.strip()
        # 0.判断当前平台是否禁用iframe,根据Site.canNested判断更准确,更便于后期维护
        # isIframeDisable=False
        # filterSiteKeys = ['okex.com', 'xbtce.com', 'coss.io', 'coinegg.com', 'coolcoin.com', 'btctrade.im','etherdelta.com']
        # for eachSiteKey in filterSiteKeys:
        #     if eachSiteKey in url:
        #         isIframeDisable=True
        #         break

        # 1.判断注入采集脚本(fixme:是否考虑只有禁用iframe的才下发采集脚本)
        matchGatherSite = XnbCacheService.getSiteByCGU(url)
        fileContent = ''
        if matchGatherSite:
            MyUtil.logInfo('平台:{},coinsGatherUrl:{},下发采集脚本'.format(matchGatherSite.name, url))
            # fixme:可能要加入限制，只让禁用iframe的平台走这个逻辑(或者统一走这里逻辑就不用gm里面每个页面单独采集)
            # 否则下发币种数据采集脚本
            fileContent = 'console.log("当前平台{}iframe嵌套,通过插件采集");'.format('支持' if matchGatherSite.canNested else '不支持')
            fileContent += Resource.getJsCoreContentsBySiteCode(matchGatherSite.siteType, matchGatherSite.code, 1)
            # 启动采币程序
            serverUrl = request.build_absolute_uri('/DJXNB/Gj/uploadSyncSiteGatherCoins')
            fileContent += ';console.log("请稍后，等待系统加载完成");setTimeout(function () {    clientReact.gatherSyncSiteGatherCoins("' + serverUrl + '");   }, 15000);'
            return HttpResponse(fileContent)

        # 2.判断注入入口脚本(fixme:后期可考虑全部通过iframe方式注入脚本)
        curSiteJoinCoin = XnbCacheService.getSiteJoinCoinByTradeUrl(url)
        if not curSiteJoinCoin:
            return HttpResponse('console.log("当前非交易页面,跳过:{}")'.format(url))
        # if not isIframeDisable:
        if not byChmExt and curSiteJoinCoin.site.canNested:
            return HttpResponse('console.log("当前平台支持iframe嵌套,跳过:{}")'.format(url))
        if not request.user.is_authenticated and 'next=' not in url:
            return HttpResponse('alert("币豚:检测那你尚未登录币豚,即将为你自动跳转登录页面,请先登录");window.location.href="{}"'.format(
                request.build_absolute_uri('/DJXNB/Home/index')))
        # 读取用户交易密码
        userStpInfo = XnbUserService.getUserStpInfo(request.user, curSiteJoinCoin.site)
        siteTradePwd = userStpInfo['siteTradePwd']
        ujsId = userStpInfo['ujsId']

        fileContent = self.getJsWsEnter(request, True)
        if ujsId:
            fileContent += ';setTimeout(function(){MyUtils.prototype.jqHelpFind("body").prepend(\'交易密码: <input type="text" style="background-color: darkseagreen" value="' + siteTradePwd + '" id="serv_stp" old_val="' + siteTradePwd + '"  ujsId="' + str(
                ujsId) + '"/> <button id="saveToServer" style="color: brown">保存到服务器(以后免输)</button><br/>\');},120000);'
            fileContent += ";setTimeout(function(){myUtils.jqHelpFind('#saveToServer').click(function (){let oldVal=$('#serv_stp').attr('old_val').trim();let curVal=$('#serv_stp').val().trim();if(oldVal==curVal){return;}if(!curVal){alert('请先输入交易密码!');return;}$.ajax({type: 'GET',url: '" + request.build_absolute_uri(
                '/DJXNB/Gj/upSTPToServ') + "',dataType:'json',data: {ujsId:$('#serv_stp').attr('ujsId'),stp:curVal},success: function (data) {if(data.isOk){alert('保存成功,为了你的隐私请刷新当前页面');}else{alert('保存失败:'+data.errMsg);}},error: function () {myUtils.log('上传错误:' + JSON.stringify(arguments));}});});},122000);";

        return HttpResponse(fileContent)


