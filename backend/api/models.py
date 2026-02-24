from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('dpo', 'dpo'),
        ('collector', 'collector'),
        ('department', 'department'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    department = models.ForeignKey(
        'Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
class Department(models.Model):
    dept_name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.dept_name
class Minutes(models.Model):
    title = models.CharField(max_length=200)
    meeting_date = models.DateField()
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_minutes'
    )
    file_path = models.FileField(upload_to='minutes/', max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
class Issue(models.Model):
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]

    minutes = models.ForeignKey(
        Minutes,
        on_delete=models.CASCADE,
        related_name='issues'
    )
    issue_no = models.CharField(max_length=20, default='', blank=True)
    issue_title = models.CharField(max_length=300)
    issue_description = models.TextField(default="")
    location = models.CharField(max_length=200)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
class IssueDepartment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('OVERDUE', 'Overdue'),
    ]

    issue = models.ForeignKey(Issue, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    deadline_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
class Response(models.Model):
    issue_department = models.ForeignKey(
        IssueDepartment,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    response_text = models.TextField()
    attachment_path = models.FileField(upload_to='responses/', null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    issue_department = models.ForeignKey(IssueDepartment, on_delete=models.CASCADE, null=True, blank=True)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
