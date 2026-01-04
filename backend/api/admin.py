from django.contrib import admin
from .models import (
    User,
    Department,
    Minutes,
    Issue,
    IssueDepartment,
    Response,
    Notification
)

admin.site.register(User)
admin.site.register(Department)
admin.site.register(Minutes)
admin.site.register(Issue)
admin.site.register(IssueDepartment)
admin.site.register(Response)
admin.site.register(Notification)
