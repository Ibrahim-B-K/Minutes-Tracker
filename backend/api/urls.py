from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login_view),
    path('upload-minutes', views.upload_minutes),
    path('assign-issues', views.get_assign_issues), # NEW!
    path('assign-issues/allocate-all', views.allocate_all),
    path('issues', views.get_all_issues),
    path('issues/<str:dept_name>', views.get_dept_issues),
    path('submit-response', views.submit_response),
    path('notifications', views.get_notifications),
]