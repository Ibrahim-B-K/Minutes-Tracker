from rest_framework import serializers
from .models import IssueDepartment, Notification

class IssueDepartmentSerializer(serializers.ModelSerializer):
    # Added 'id' as an alias for 'issue_dept_id' so the Frontend doesn't send 'undefined'
    id = serializers.IntegerField(source='issue_dept_id', read_only=True)
    issue_no = serializers.CharField(source='issue.issue_no', read_only=True)
    issue = serializers.CharField(source='issue.issue_title', read_only=True)
    department = serializers.CharField(source='department.dept_name', read_only=True)
    deadline = serializers.DateField(source='deadline_date', read_only=True, format="%d-%m-%Y")
    location = serializers.CharField(source='issue.location', read_only=True)
    priority = serializers.CharField(source='issue.priority', read_only=True)
    response = serializers.CharField(source='response.response_text', read_only=True, allow_null=True)

    class Meta:
        model = IssueDepartment
        fields = [
            'id',             # Frontend expects this
            'issue_dept_id', 
            'issue_no', 
            'issue', 
            'department', 
            'location', 
            'priority', 
            'deadline', 
            'status', 
            'response'
        ]

class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['notification_id', 'message', 'type', 'is_read', 'time_ago', 'created_at']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"