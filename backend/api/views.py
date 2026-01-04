from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.contrib.auth import authenticate, login, logout
from django.utils import timezone
from django.db.models import Q

from datetime import datetime, date
import os

from .models import (
    User,
    Department,
    Issue,
    IssueDepartment,
    Minutes,
    Response as ResponseModel,
    Notification
)
from .serializers import IssueDepartmentSerializer, NotificationSerializer
from .gemini_utils import analyze_document_with_gemini

# Temporary in-memory cache
TEMP_DATA_CACHE = []


# ---------------- AUTH ---------------- #

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"error": "Username and password required"}, status=400)

    user = authenticate(username=username, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=401)

    login(request, user)

    return Response({
        "success": True,
        "username": user.username,
        "role": user.role,
        "department": user.department.dept_name if user.department else None
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"success": True})


# ---------------- MINUTES UPLOAD ---------------- #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_minutes(request):
    if request.user.role != 'DPO':
        return Response({"error": "Only DPO can upload minutes"}, status=403)

    global TEMP_DATA_CACHE

    file = request.FILES.get('file')
    if not file:
        return Response({"error": "File required"}, status=400)

    os.makedirs('media/minutes', exist_ok=True)
    file_path = f"media/minutes/{file.name}"

    with open(file_path, 'wb+') as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    raw_data = analyze_document_with_gemini(file_path)

    clean_data = []
    for item in raw_data:
        depts = item.get('departments', [])
        if not depts:
            single = item.get('department')
            depts = [single] if single else ["GENERAL"]

        item['department'] = ", ".join([str(d).upper() for d in depts if d])
        clean_data.append(item)

    TEMP_DATA_CACHE = clean_data
    return Response({"success": True, "data": clean_data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assign_issues(request):
    return Response(TEMP_DATA_CACHE)


# ---------------- ALLOCATION ---------------- #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def allocate_all(request):
    if request.user.role != 'DPO':
        return Response({"error": "Only DPO can allocate issues"}, status=403)

    global TEMP_DATA_CACHE
    issues_data = request.data.get('issues', []) or TEMP_DATA_CACHE

    minute = Minutes.objects.create(
        title="Uploaded Minutes",
        meeting_date=timezone.now(),
        uploaded_by=request.user,
        file_path="dummy"
    )

    dept_counts = {}

    for item in issues_data:
        issue = Issue.objects.create(
            minute=minute,
            issue_no=item.get('issue_no', '0'),
            issue_title=item.get('issue', 'No Title'),
            location=item.get('location', ''),
            priority=item.get('priority', 'Medium')
        )

        dept_list = [
            d.strip().upper()
            for d in str(item.get('department', 'GENERAL')).split(",")
            if d.strip()
        ]

        for dept_name in dept_list:
            dept, _ = Department.objects.get_or_create(dept_name=dept_name)
            dept_counts[dept] = dept_counts.get(dept, 0) + 1

            d_date = None
            if item.get('deadline'):
                try:
                    d_date = datetime.strptime(
                        item['deadline'], '%d-%m-%Y'
                    ).date()
                except:
                    pass

            IssueDepartment.objects.create(
                issue=issue,
                department=dept,
                deadline_date=d_date
            )

    for dept, count in dept_counts.items():
        users = User.objects.filter(department=dept).exclude(role__in=['DPO', 'COLLECTOR'])
        for u in users:
            Notification.objects.create(
                user=u,
                type='assign',
                message=f"ACTION REQUIRED: {count} new issues assigned."
            )

    TEMP_DATA_CACHE = []
    return Response({"success": True})


# ---------------- ISSUES ---------------- #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_issues(request):
    if request.user.role not in ['DPO', 'COLLECTOR']:
        return Response({"error": "Unauthorized"}, status=403)

    today = date.today()
    issues = IssueDepartment.objects.all().order_by('-issue__issue_id')

    for i in issues:
        if i.status == 'pending' and i.deadline_date and i.deadline_date < today:
            i.status = 'overdue'
            i.save()

    return Response(IssueDepartmentSerializer(issues, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dept_issues(request, dept_name):
    if request.user.role != 'DEPT':
        return Response({"error": "Unauthorized"}, status=403)

    today = date.today()
    issues = IssueDepartment.objects.filter(
        department__dept_name__iexact=dept_name.strip()
    ).order_by('-issue__issue_id')

    for i in issues:
        if i.status == 'pending' and i.deadline_date and i.deadline_date < today:
            i.status = 'overdue'
            i.save()

    return Response(IssueDepartmentSerializer(issues, many=True).data)


# ---------------- RESPONSES ---------------- #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_response(request):
    if request.user.role != 'DEPT':
        return Response({"error": "Only departments can submit"}, status=403)

    issue_id = request.data.get('issue_id')
    response_text = request.data.get('response')

    if not issue_id:
        return Response({"error": "Issue ID required"}, status=400)

    issue_link = IssueDepartment.objects.get(issue_dept_id=issue_id)

    ResponseModel.objects.update_or_create(
        issue_dept=issue_link,
        defaults={'response_text': response_text}
    )

    issue_link.status = 'submitted'
    issue_link.save()

    dpos = User.objects.filter(Q(role='DPO') | Q(username__iexact='dpo'))
    for d in dpos:
        Notification.objects.create(
            user=d,
            issue_link=issue_link,
            type='response',
            message=f"{issue_link.department.dept_name} responded to Issue #{issue_link.issue.issue_no}"
        )

    return Response({"success": True})


# ---------------- NOTIFICATIONS ---------------- #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifs = Notification.objects.filter(
        user=request.user
    ).order_by('-created_at')[:20]

    return Response(NotificationSerializer(notifs, many=True).data)
