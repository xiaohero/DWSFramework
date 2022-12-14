'''
Created on 2017年6月22日

@author: xiaoxi
'''
from django.core import validators
    

class ModelValidatorUtil:
    @classmethod
    def alphaNumeric(cls):
        return validators.RegexValidator(
            regex='^[a-zA-Z0-9_\-]+$',
            message='Code must be alphanumeric',
            # code='invalid_code'
        )

    @classmethod
    def numeric(cls):
        return validators.RegexValidator(
            regex='^[0-9]+$',
            message='Code must be numeric',
            # code='invalid_code'
        )