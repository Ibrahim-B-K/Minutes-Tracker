from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q

from datetime import datetime, date
import os


from rest_framework.authtoken.models import Token



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


# ================= TEMP CACHE (ONLY FOR NOW) ================= #
TEMP_DATA_CACHE = []


# ================= AUTH ================= #


@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({"success": False, "message": "Missing credentials"}, status=400)

    user = authenticate(username=username, password=password)

    if user is None:
        return Response({"success": False, "message": "Invalid username or password"}, status=401)

    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "success": True,
        "token": token.key,
        "username": user.username,
        "role": user.role,
        "department": user.department.dept_name if user.department else None
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"success": True})
# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def logout_view(request):
#     request.auth.delete()   # delete token
#     return Response({"success": True}) #keerthi added this js for verification-didnt check



# ================= MINUTES UPLOAD ================= #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_minutes(request):
    if request.user.role != 'dpo':
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
        depts = item.get('departments') or []
        if not depts:
            depts = [item.get('department', 'GENERAL')]

        item['department'] = ", ".join(d.upper() for d in depts if d)
        clean_data.append(item)

    TEMP_DATA_CACHE = clean_data
    return Response({"success": True, "data": clean_data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assign_issues(request):
    if request.user.role != 'dpo':
        return Response({"error": "Unauthorized"}, status=403)
    return Response(TEMP_DATA_CACHE)


# ================= ISSUE ALLOCATION ================= #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def allocate_all(request):
    if request.user.role != 'dpo':
        return Response({"error": "Only DPO can allocate"}, status=403)

    global TEMP_DATA_CACHE
    issues_data = request.data.get('issues') or TEMP_DATA_CACHE

    minute = Minutes.objects.create(
        title="Uploaded Minutes",
        meeting_date=timezone.now(),
        uploaded_by=request.user,
        file_path="dummy"
    )

    dept_counts = {}

    for item in issues_data:
        issue = Issue.objects.create(
            minutes=minute,
            issue_title=item.get('issue', ''),
            issue_description=item.get('description', ''),
            location=item.get('location', ''),
            priority=item.get('priority', 'MEDIUM')
        )

        dept_list = [
            d.strip().upper()
            for d in str(item.get('department', 'GENERAL')).split(',')
            if d.strip()
        ]

        for dept_name in dept_list:
            dept, _ = Department.objects.get_or_create(dept_name=dept_name)
            dept_counts[dept] = dept_counts.get(dept, 0) + 1

            deadline = None
            if item.get('deadline'):
                try:
                    deadline = datetime.strptime(item['deadline'], '%d-%m-%Y').date()
                except:
                    pass

            IssueDepartment.objects.create(
                issue=issue,
                department=dept,
                deadline_date=deadline,
                status='PENDING'
            )

    for dept, count in dept_counts.items():
        users = User.objects.filter(role='department', department=dept)
        for u in users:
            Notification.objects.create(
                user=u,
                issue_department=None,
                message=f"{count} new issues assigned."
            )

    TEMP_DATA_CACHE = []
    return Response({"success": True})


# ================= ISSUES ================= #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_issues(request):
    if request.user.role not in ['dpo', 'collector']:
        return Response({"error": "Unauthorized"}, status=403)

    today = date.today()
    issues = IssueDepartment.objects.select_related(
        'issue', 'department'
    ).order_by('-issue__id')

    for i in issues:
        if i.status == 'PENDING' and i.deadline_date and i.deadline_date < today:
            i.status = 'OVERDUE'
            i.save()

    return Response(IssueDepartmentSerializer(issues, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dept_issues(request):
    if request.user.role != 'department':
        return Response({"error": "Unauthorized"}, status=403)

    today = date.today()
    issues = IssueDepartment.objects.filter(
        department=request.user.department
    ).order_by('-issue__id')

    for i in issues:
        if i.status == 'PENDING' and i.deadline_date and i.deadline_date < today:
            i.status = 'OVERDUE'
            i.save()

    return Response(IssueDepartmentSerializer(issues, many=True).data)


# ================= RESPONSES ================= #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_response(request):
    if request.user.role != 'department':
        return Response({"error": "Only departments can submit"}, status=403)

    issue_dept_id = request.data.get('issue_id')
    response_text = request.data.get('response')

    if not issue_dept_id:
        return Response({"error": "Issue ID required"}, status=400)

    issue_link = IssueDepartment.objects.get(id=issue_dept_id)

    ResponseModel.objects.update_or_create(
        issue_department=issue_link,
        defaults={'response_text': response_text}
    )

    issue_link.status = 'COMPLETED'
    issue_link.save()

    dpos = User.objects.filter(role='dpo')
    for d in dpos:
        Notification.objects.create(
            user=d,
            issue_department=issue_link,
            message=f"{issue_link.department.dept_name} submitted a response."
        )

    return Response({"success": True})


# ================= NOTIFICATIONS ================= #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    notifs = Notification.objects.filter(
        user=request.user
    ).order_by('-created_at')[:20]

    return Response(NotificationSerializer(notifs, many=True).data)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({
        "authenticated": True,
        "username": request.user.username,
        "role": request.user.role,
    })
# core/views.py
from django.http import JsonResponse

def test_view(request):
    print("🔥 TEST VIEW HIT:", request.method)
    return JsonResponse({"ok": True})
