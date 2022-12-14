'''
Created on 2017年6月22日

@author: xiaoxi
'''
from urllib.request import urlopen
from urllib.parse import urlencode
from urllib.parse import urlparse
import json
import http.client

import re


class HttpUtil:
    @classmethod
    def get(cls, url,params={},returnJson=False):
        retData=None
        if params:
            url = url + '?' + urlencode(params)
        retData = urlopen(url).read()
        retData=retData.decode('utf-8') if isinstance(retData,bytes) else False
        return json.loads(retData) if returnJson else retData

    @classmethod
    def curlGet(cls, url,params={}):
        urlInfo = urlparse(url)
        #print(urlInfo)
        # print(urlInfo.path+'?'+urlencode(params))
        # headers = {'Content-type': 'application/json'}
        headers = {'Content-type': 'application/x-www-form-urlencoded','Accept': 'text/plain'}
        if 'https'==urlInfo.scheme:
            conn = http.client.HTTPSConnection(urlInfo.netloc)
        else:
            conn = http.client.HTTPConnection(urlInfo.netloc)
        conn.request('GET', urlInfo.path if not params else urlInfo.path + '?' + urlencode(params), headers=headers)
        res = conn.getresponse()
        retData = res.read().decode()
        conn.close()
        # print(res.status, res.reason)
        # print(retData)
        retData = json.loads(retData)
        return retData

    @classmethod
    def post(cls, key,amount=1):
        pass

    @classmethod
    def getDomainByUrl(cls, url,getLv1=False,suffixLv1='com|cn|net|ws'):
        domain=''
        if url and isinstance(url,str):
            urlInfos=urlparse(url)
            if urlInfos and getattr(urlInfos,'netloc',None):
                domain=getattr(urlInfos,'netloc')
                if getLv1 and re.findall('.{}'.format(suffixLv1), domain) and len(domain.split('.'))>2:
                    domain='{}.{}'.format(domain.split('.')[-2],domain.split('.')[-1])
        return domain

    @classmethod
    def getOnlyUrl(cls, fullUrl):
        urlInfos = urlparse(fullUrl)
        if not urlInfos:
            return ''
        return '{}://{}{}'.format(urlInfos.scheme,urlInfos.netloc,urlInfos.path)

    @classmethod
    def getOnlyUrlHost(cls, fullUrl):
        return cls.getOnlyUrl(fullUrl).replace('http://','').replace('https://','')