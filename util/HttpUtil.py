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
    def get(cls, url,params={}):
        retData=None
        if params:
            url = url + '?' + urlencode(params)
        retData = json.loads(urlopen(url).read())
        return retData

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
    def getDomainByUrl(cls, url,getLv1=False):
        domain=''
        if url and isinstance(url,str):
            urlInfos=urlparse(url)
            if urlInfos and getattr(urlInfos,'netloc',None):
                domain=getattr(urlInfos,'netloc')
                if getLv1 and re.findall('.com|cn|net', domain) and len(domain.split('.'))>2:
                    domain='{}.{}'.format(domain.split('.')[-2],domain.split('.')[-1])
        return domain