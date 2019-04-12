'''
Created on 2017年6月22日

@author: xiaoxi
'''
from django.contrib import admin

class ReadOnlyAdmin(admin.ModelAdmin):
    def get_readonly_fields(self, request, obj=None):
        return [field.name for field in self.opts.local_fields] + \
               [field.name for field in self.opts.local_many_to_many] + \
               list(self.get_readonly_fields(request, obj))
    # def has_add_permission(self, request):
    #     return False
    # def has_delete_permission(self, request, obj=None):
    #     return False

class ReadOnlyAdmin(admin.ModelAdmin):
    readonly_fields = []
    def get_readonly_fields(self, request, obj=None):
        return list(self.readonly_fields) + \
               [field.name for field in obj._meta.fields] + \
               [field.name for field in obj._meta.many_to_many]
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False


# class ReadOnlyTabularInline(admin.TabularInline):
#     extra = 0
#     can_delete = False
#     editable_fields = []
#     readonly_fields = []
#     exclude = []
#     def get_readonly_fields(self, request, obj=None):
#         return list(self.readonly_fields) + \
#                [field.name for field in self.model._meta.fields
#                 if field.name not in self.editable_fields and
#                 field.name not in self.exclude]
#
#     def has_add_permission(self, request):
#         return False
