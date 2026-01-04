from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q # <--- Added Q for better queries
from .models import User, Department, Issue, IssueDepartment, Minutes, Response as ResponseModel, Notification
from .serializers import IssueDepartmentSerializer, NotificationSerializer
from .gemini_utils import analyze_document_with_gemini
import os
from datetime import datetime, date

TEMP_DATA_CACHE = []

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username', '').lower()
    user = User.objects.filter(username__iexact=username).first()
    
    if username == 'dpo' or (user and user.role == 'DPO'):
        return Response({'success': True, 'role': 'dpo', 'department': None})
    
    if user:
        dept_name = user.department.dept_name if user.department else username
        return Response({'success': True, 'role': 'dept', 'department': dept_name})
    
    return Response({'success': True, 'role': 'dept', 'department': username})

@api_view(['POST'])
def upload_minutes(request):
    global TEMP_DATA_CACHE
    file = request.FILES['file']
    if not os.path.exists('media/minutes'): os.makedirs('media/minutes')
    file_path = f"media/minutes/{file.name}"
    with open(file_path, 'wb+') as dest:
        for chunk in file.chunks(): dest.write(chunk)
    
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
    return Response({"message": "Success", "data": clean_data})

@api_view(['GET'])
def get_assign_issues(request):
    return Response(TEMP_DATA_CACHE)

@api_view(['POST'])
def allocate_all(request):
    global TEMP_DATA_CACHE
    issues_data = request.data.get('issues', [])
    if not issues_data: issues_data = TEMP_DATA_CACHE 
    
    u_by = User.objects.filter(role='DPO').first() or User.objects.first()
    minute = Minutes.objects.create(title="Uploaded Minutes", meeting_date=timezone.now(), uploaded_by=u_by, file_path="dummy")
    
    dept_counts = {} # Track count for batch notification

    for item in issues_data:
        issue = Issue.objects.create(
            minute=minute, 
            issue_no=item.get('issue_no', '0'), 
            issue_title=item.get('issue', 'No Title'), 
            location=item.get('location', ''), 
            priority=item.get('priority', 'Medium')
        )

        raw_dept_str = item.get('department', 'General')
        dept_list = [d.strip().upper() for d in str(raw_dept_str).split(",") if d.strip()]

        for dept_name in dept_list:
            dept, _ = Department.objects.get_or_create(dept_name=dept_name)
            
            # Increment count
            dept_counts[dept] = dept_counts.get(dept, 0) + 1
            
            d_str = item.get('deadline')
            d_date = None
            if d_str:
                try: d_date = datetime.strptime(d_str, '%d-%m-%Y').date()
                except: pass

            IssueDepartment.objects.create(issue=issue, department=dept, deadline_date=d_date)

    # --- BATCH NOTIFICATION (Fixed Logic) ---
    for dept, count in dept_counts.items():
        # Find users in this department BUT EXCLUDE DPO/Collector
        users = User.objects.filter(department=dept).exclude(role__in=['DPO', 'COLLECTOR'])
        
        for u in users:
            Notification.objects.create(
                user=u, 
                type='assign', 
                message=f"ACTION REQUIRED: {count} new issues have been assigned to your department."
            )

    TEMP_DATA_CACHE = []
    return Response({"success": True})

@api_view(['GET'])
def get_all_issues(request):
    today = date.today()
    issues = IssueDepartment.objects.all().order_by('-issue__issue_id')
    for i in issues:
        if i.status == 'pending' and i.deadline_date and i.deadline_date < today:
            i.status = 'overdue'
            i.save()
    serializer = IssueDepartmentSerializer(issues, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_dept_issues(request, dept_name):
    today = date.today()
    issues = IssueDepartment.objects.filter(department__dept_name__iexact=dept_name.strip()).order_by('-issue__issue_id')
    for i in issues:
        if i.status == 'pending' and i.deadline_date and i.deadline_date < today:
            i.status = 'overdue'
            i.save()
    serializer = IssueDepartmentSerializer(issues, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def submit_response(request):
    issue_id = request.data.get('issue_id') or request.data.get('id')
    response_text = request.data.get('response')

    if not issue_id or str(issue_id) == "undefined":
        return Response({"error": "Invalid ID"}, status=400)

    try:
        issue_link = IssueDepartment.objects.get(issue_dept_id=issue_id)
        
        ResponseModel.objects.update_or_create(
            issue_dept=issue_link, 
            defaults={'response_text': response_text}
        )
        
        issue_link.status = 'submitted'
        issue_link.save()
        
        # --- FIX: NOTIFY DPO (Robust) ---
        # Find anyone with role='DPO' OR username='dpo'
        dpos = User.objects.filter(Q(role__iexact='DPO') | Q(username__iexact='dpo'))
        
        for d in dpos:
            Notification.objects.create(
                user=d, 
                issue_link=issue_link, 
                type='response', 
                message=f"Response Received: {issue_link.department.dept_name} responded to Issue #{issue_link.issue.issue_no}"
            )
            
        return Response({"success": True})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(['GET'])
def get_notifications(request):
    raw_username = request.query_params.get('username', '')
    user = User.objects.filter(username__iexact=raw_username).first()
    if not user:
        return Response([])
    notifs = Notification.objects.filter(user=user).order_by('-created_at')[:20]
    return Response(NotificationSerializer(notifs, many=True).data)