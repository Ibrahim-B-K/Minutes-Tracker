from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login_view),
    path('logout', views.logout_view),
    path('upload-minutes', views.upload_minutes),
    path('minutes', views.get_minutes),
    path('minutes/<int:minutes_id>', views.delete_minutes),
    path('assign-issues', views.get_assign_issues),
    path('assign-issues/allocate-all', views.allocate_all),
    path('assign-issues/allocate-single', views.allocate_single),
    path('existing-issues', views.get_existing_issues),
    path('match-issues', views.match_issues),
    path('issues', views.get_all_issues),
    path('issues/<int:issue_id>/lifecycle', views.get_issue_lifecycle),
    path('issues/resolve/<int:issue_id>', views.resolve_issue),
    path('issues/<str:dept_name>', views.get_dept_issues),
    path('submit-response', views.submit_response),
    path('notifications', views.get_notifications),
    path('generate-report', views.generate_report),
    path('send-overdue-alerts', views.send_overdue_alerts),
]

