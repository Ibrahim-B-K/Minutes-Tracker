from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class Department(models.Model):
    dept_id = models.AutoField(primary_key=True)
    dept_name = models.CharField(max_length=100, unique=True)
    email = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.dept_name

class User(AbstractUser):
    ROLE_CHOICES = [('DPO', 'DPO'), ('COLLECTOR', 'COLLECTOR'), ('DEPT', 'DEPT')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DEPT')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)

class Minute(models.Model):
    minutes_id = models.AutoField(primary_key=True)
    title = models.CharField(max_length=200)
    meeting_date = models.DateField()
    # ADDED THIS BACK TO MATCH VIEWS
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    file_path = models.FileField(upload_to='minutes/')
    created_at = models.DateTimeField(auto_now_add=True)

class Issue(models.Model):
    PRIORITY_CHOICES = [('High', 'High'), ('Medium', 'Medium'), ('Low', 'Low')]
    issue_id = models.AutoField(primary_key=True)
    minute = models.ForeignKey(Minute, on_delete=models.CASCADE, related_name='issues', null=True)
    issue_no = models.CharField(max_length=50)
    issue_title = models.TextField()
    description = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='Medium')
    created_at = models.DateTimeField(auto_now_add=True)

class IssueDepartment(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('submitted', 'Submitted'), ('overdue', 'Overdue'), ('completed', 'Completed')]
    issue_dept_id = models.AutoField(primary_key=True)
    issue = models.ForeignKey(Issue, on_delete=models.CASCADE, related_name='assigned_depts')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    deadline_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

class Response(models.Model):
    response_id = models.AutoField(primary_key=True)
    issue_dept = models.OneToOneField(IssueDepartment, on_delete=models.CASCADE, related_name='response')
    response_text = models.TextField()
    attachment = models.FileField(upload_to='responses/', blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    TYPE_CHOICES = [('assign', 'Assignment'), ('response', 'Response'), ('deadline', 'Deadline')]
    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    issue_link = models.ForeignKey(IssueDepartment, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='assign')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)