from rest_framework import serializers
from .models import IssueDepartment, Notification, Issue

class IssueDepartmentSerializer(serializers.ModelSerializer):
    # FIX: Use 'id' directly. Removed 'source=issue_dept_id' which caused the crash.
    id = serializers.IntegerField(read_only=True)
    
    # FIX: Use 'issue.id' because we didn't add the 'issue_no' column to the DB
    issue_no = serializers.CharField(source='issue.id', read_only=True)
    issue_description = serializers.CharField(source='issue.issue_description', read_only=True)
    issue = serializers.CharField(source='issue.issue_title', read_only=True)
    department = serializers.CharField(source='department.dept_name', read_only=True)
    deadline = serializers.DateField(source='deadline_date', read_only=True, format="%d-%m-%Y")
    location = serializers.CharField(source='issue.location', read_only=True)
    priority = serializers.CharField(source='issue.priority', read_only=True)
    
    # FIX: Use a method to get the response safely (since it's a One-to-Many relation)
    response = serializers.SerializerMethodField()

    class Meta:
        model = IssueDepartment
        fields = [
            'id',             
            # 'issue_dept_id',  <-- REMOVED THIS CAUSE OF ERROR
            'issue_no', 
            'issue',
            'issue_description',
            'department', 
            'location', 
            'priority', 
            'deadline', 
            'status', 
            'response'
        ]

    def get_response(self, obj):
        # Fetch the latest response text and attachment if available
        last_response = obj.responses.last()
        if not last_response:
            return None
            
        return {
            "text": last_response.response_text,
            "attachment": last_response.attachment_path.url if last_response.attachment_path else None
        }

class DPOIssueSerializer(serializers.ModelSerializer):
    # FIX: Use 'id' as issue_no
    issue_no = serializers.IntegerField(source='id', read_only=True)
    
    issue = serializers.CharField(source='issue_title')
    issue_description = serializers.CharField()
    location = serializers.CharField()
    priority = serializers.CharField()
    
    # Custom fields for grouping
    department = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    deadline = serializers.SerializerMethodField()
    response = serializers.SerializerMethodField()

    class Meta:
        model = Issue
        fields = [
            'id', 
            'issue_no', 
            'issue', 
            'issue_description',
            'location', 
            'priority', 
            'department', 
            'status', 
            'deadline', 
            'response'
        ]
    
    def get_department(self, obj):
        # Combines multiple departments: "POLICE, PWD"
        assignments = obj.issuedepartment_set.all()
        return ", ".join([a.department.dept_name for a in assignments])

    def get_status(self, obj):
        statuses = [a.status.lower() for a in obj.issuedepartment_set.all()]
        if not statuses: return "pending"
        if "overdue" in statuses: return "overdue"
        if all(s in ["submitted", "completed"] for s in statuses):
            return "submitted"
        return "pending"

    def get_deadline(self, obj):
        deadlines = [a.deadline_date for a in obj.issuedepartment_set.all() if a.deadline_date]
        if not deadlines: return "N/A"
        return min(deadlines).strftime("%d-%m-%Y")

    def get_response(self, obj):
        # Collects responses: [{"dept": "Police", "text": "...", "attachment": "..."}]
        response_list = []
        for assign in obj.issuedepartment_set.all():
            latest_resp = assign.responses.last()
            if latest_resp:
                response_list.append({
                    "department": assign.department.dept_name,
                    "text": latest_resp.response_text or "",
                    "attachment": latest_resp.attachment_path.url if latest_resp.attachment_path else None
                })
        return response_list if response_list else None

class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'message', 'is_read', 'time_ago', 'created_at', 'type']

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"

    def get_type(self, obj):
        msg = obj.message.lower()
        if "response" in msg: return "response"
        if "assigned" in msg or "action required" in msg: return "assign"
        if "deadline" in msg or "overdue" in msg: return "deadline"
        return "general"