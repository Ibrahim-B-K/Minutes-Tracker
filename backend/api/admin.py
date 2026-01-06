from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User,
    Department,
    Minutes,
    Issue,
    IssueDepartment,
    Response,
    Notification
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = ("username", "role", "department", "is_staff")
    list_filter = ("role", "is_staff")

    fieldsets = UserAdmin.fieldsets + (
        ("Extra Info", {"fields": ("role", "department")}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Extra Info", {"fields": ("role", "department")}),
    )

    search_fields = ("username",)
    ordering = ("username",)


admin.site.register(Department)
admin.site.register(Minutes)
admin.site.register(Issue)
admin.site.register(IssueDepartment)
admin.site.register(Response)
admin.site.register(Notification)
