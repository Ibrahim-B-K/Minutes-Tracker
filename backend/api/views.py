from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from django.contrib.auth import authenticate, login, logout, get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q

from datetime import datetime, date
import os
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side
from django.http import HttpResponse

from rest_framework.authtoken.models import Token
from collections import defaultdict


from .models import (
    User,
    Department,
    Issue,
    IssueDepartment,
    Minutes,
    Response as ResponseModel,
    Notification
)
from .services import check_and_send_overdue_emails
from .serializers import IssueDepartmentSerializer, NotificationSerializer, DPOIssueSerializer
from .gemini_utils import analyze_document_with_gemini
import os
from datetime import datetime, date, timedelta

# ================= TEMP CACHE (ONLY FOR NOW) ================= #
TEMP_DATA_CACHE = []


# ================= AUTH ================= #


@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    print("\n\n🔥 ================= DIAGNOSTIC LOGIN START ================= 🔥")
    
    # 1. Capture what the Frontend sent
    username_input = request.data.get('username')
    password_input = request.data.get('password')
    print(f"🔥 INPUT RECEIVED -> Username: '{username_input}' | Password: '{password_input}'")

    if not username_input or not password_input:
        print("🔥 ERROR: Username or Password missing in request body.")
        return Response({"success": False, "message": "Missing credentials"}, status=400)

    # 2. direct Database Check (Bypassing authentication to see if user exists)
    User = get_user_model()
    try:
        # Try finding exact match
        user_db = User.objects.get(username=username_input)
        print(f"🔥 DB LOOKUP -> ✅ User '{username_input}' found in database.")
        print(f"   - ID: {user_db.id}")
        print(f"   - Role: {user_db.role}")
        print(f"   - is_active: {user_db.is_active}")
        print(f"   - Password Valid?: {user_db.check_password(password_input)}")
        
        if not user_db.is_active:
            print("   ⚠️ WARNING: User is INACTIVE. Login will fail.")
        
        if not user_db.check_password(password_input):
            print("   ⚠️ WARNING: Password check FAILED. The password stored does not match the input.")

    except User.DoesNotExist:
        print(f"🔥 DB LOOKUP -> ❌ User '{username_input}' does NOT exist.")
        # Check if it exists with different capitalization
        similar = User.objects.filter(username__iexact=username_input)
        if similar.exists():
            print(f"   ⚠️ FOUND MISMATCH: Did you mean '{similar.first().username}'?")
        else:
            print(f"   ⚠️ No user found. Available users: {list(User.objects.values_list('username', flat=True))}")

    # 3. Actual Authentication Attempt
    user = authenticate(username=username_input, password=password_input)

    if user is None:
        print("🔥 FINAL RESULT -> ❌ authenticate() failed.")
        print("🔥 ================= DIAGNOSTIC LOGIN END ================= 🔥\n\n")
        return Response({"success": False, "message": "Invalid username or password"}, status=401)

    print("🔥 FINAL RESULT -> ✅ Login Successful!")
    print("🔥 ================= DIAGNOSTIC LOGIN END ================= 🔥\n\n")

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
    request.user.auth_token.delete()  # Delete the token
    return Response({"success": True})



# ================= MINUTES UPLOAD ================= #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_minutes(request):
    if request.user.role.lower() != 'dpo':
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
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Unauthorized"}, status=403)
    return Response(TEMP_DATA_CACHE)


# ================= ISSUE ALLOCATION ================= #

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def allocate_all(request):
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Only DPO can allocate"}, status=403)

    global TEMP_DATA_CACHE
    issues_data = request.data.get('issues', [])
    if not issues_data: issues_data = TEMP_DATA_CACHE 
    
    # 1. User Safety Check
    u_by = User.objects.filter(role='DPO').first()
    if not u_by:
        u_by = User.objects.first()
    if not u_by:
        u_by = User.objects.create_user(username='dpo', password='dpo', role='DPO')

    # 2. Create Minutes
    minute_obj = Minutes.objects.create(
        title="Uploaded Minutes", 
        meeting_date=timezone.now(), 
        uploaded_by=u_by, 
        file_path="dummy"
    )
    
    dept_counts = {}

    for item in issues_data:
        raw_title = item.get('issue', 'No Title') or ""
        safe_title = str(raw_title).strip()[:200]

        raw_location = item.get('location', '') or ""
        safe_location = str(raw_location).strip()[:200]

        issue = Issue.objects.create(
            minutes=minute_obj, 
            issue_title=item.get('issue', 'No Title'),
            issue_description=item.get('issue_description', ''),
            location=item.get('location', ''), 
            priority=item.get('priority', 'Medium')
        )

        dept_list = [
            d.strip().upper()
            for d in str(item.get('department', 'GENERAL')).split(',')
            if d.strip()
        ]

        for dept_name in dept_list:
            safe_dept_name = dept_name[:100]
            dept, _ = Department.objects.get_or_create(dept_name=safe_dept_name)
            
            dept_counts[dept] = dept_counts.get(dept, 0) + 1
            
            d_str = item.get('deadline')
            d_date = None
            if d_str:
                try: 
                    d_date = datetime.strptime(str(d_str), '%d-%m-%Y').date()
                except: 
                    d_date = None
            
            # Default to 7 days if date missing
            if d_date is None:
                d_date = date.today() + timedelta(days=7) 

            IssueDepartment.objects.create(
                issue=issue, 
                department=dept, 
                deadline_date=d_date,
                status='pending'  # <--- FIX: MUST BE LOWERCASE 'pending'
            )

    for dept, count in dept_counts.items():
        users = User.objects.filter(department=dept).exclude(role__in=['DPO', 'COLLECTOR'])
        for u in users:
            Notification.objects.create(
                user=u, 
                issue_department=None, 
                message=f"ACTION REQUIRED: {count} new issues have been assigned to your department."
            )

    TEMP_DATA_CACHE = []
    return Response({"success": True})


# ================= ISSUES ================= #

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_issues(request):
    if request.user.role.lower() not in ['dpo', 'collector']:
        return Response({"error": "Unauthorized"}, status=403)

    today = date.today()
    
    # 1. Update Overdue Status (Optimized)
    overdue_assignments = IssueDepartment.objects.filter(
        status__iexact='pending', 
        deadline_date__lt=today
    )
    for i in overdue_assignments:
        i.status = 'overdue'
        i.save()

    # 2. Get the date filter
    filter_date = request.query_params.get('date')

    # 3. Start Query (FIXED for Speed AND Accuracy)
    # We kept 'department' (Major Speed Boost) but REMOVED 'responses'.
    # This ensures the serializer finds the latest response text correctly.
    issues_query = Issue.objects.prefetch_related(
        'issuedepartment_set',
        'issuedepartment_set__department'
        # REMOVED: 'issuedepartment_set__responses' (This was causing the bug)
    ).all().order_by('-id')

    # 4. Apply Date Filter
    if filter_date:
        issues_query = issues_query.filter(minutes__meeting_date__date=filter_date)

    serializer = DPOIssueSerializer(issues_query, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dept_issues(request, dept_name):
    if request.user.role.lower() != 'department':
        return Response({"error": "Unauthorized"}, status=403)

    today = date.today()
    
    # 1. OPTIMIZATION: 'select_related' fetches the parent Issue and Dept info in the SAME query.
    # 'prefetch_related' fetches all the responses in the SAME query.
    issues_query = IssueDepartment.objects.select_related('issue', 'department').prefetch_related('responses').filter(
        department__dept_name__iexact=dept_name.strip()
    ).order_by('-issue__id') 
    
    # 2. Update Overdue Status (Only for pending items to save time)
    # We iterate through the already fetched list to avoid a second DB hit
    for i in issues_query:
        if i.status.lower() == 'pending' and i.deadline_date and i.deadline_date < today:
            i.status = 'overdue'
            i.save()
            
    serializer = IssueDepartmentSerializer(issues_query, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_response(request):
    # 1. Get data safely (handle both JSON and FormData)
    issue_id = request.data.get('issue_id') or request.data.get('id')
    response_text = request.data.get('response')
    attachment = request.FILES.get('attachment')

    print(f"📝 Submitting response for ID: {issue_id}")

    if not issue_id or str(issue_id) == "undefined":
        return Response({"error": "Invalid ID provided"}, status=400)

    try:
        issue_link = IssueDepartment.objects.get(id=issue_id)
        
        # FIX: Create Response with attachment
        ResponseModel.objects.create(
            issue_department=issue_link, 
            response_text=response_text or "",
            attachment_path=attachment
        )
        
        issue_link.status = 'submitted'
        issue_link.save()
        
        # --- NOTIFY DPO ---
        dpos = User.objects.filter(Q(role__iexact='DPO') | Q(username__iexact='dpo'))
        issue_number = issue_link.issue.id 
        dept_name = issue_link.department.dept_name

        for d in dpos:
            Notification.objects.create(
                user=d, 
                issue_department=issue_link,
                message=f"Response Received: {dept_name} responded to Issue #{issue_number}"
            )
            
        return Response({"success": True})

    except IssueDepartment.DoesNotExist:
        return Response({"error": "Issue not found"}, status=404)
    except Exception as e:
        print(f"🔥 CRITICAL SUBMIT ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)

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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_report(request):
    # 1. Fetch only 'Submitted'/'Received' issues
    items = IssueDepartment.objects.filter(
        status__in=['submitted', 'received', 'completed']
    ).select_related('issue', 'issue__minutes', 'department').prefetch_related('responses')

    # 2. Group by Issue ID
    # Structure: { issue_id: { 'issue_obj': issue, 'depts': [], 'responses': [] } }
    grouped_data = defaultdict(lambda: {'issue': None, 'depts': [], 'responses': []})

    for item in items:
        # Initialize the issue object if not set
        if grouped_data[item.issue.id]['issue'] is None:
            grouped_data[item.issue.id]['issue'] = item.issue
        
        # Add Department Name
        grouped_data[item.issue.id]['depts'].append(item.department.dept_name)
        
        # Add Response with Dept Prefix
        last_response = item.responses.last()
        resp_text = last_response.response_text if last_response else "No status update."
        formatted_response = f"[{item.department.dept_name}]: {resp_text}"
        grouped_data[item.issue.id]['responses'].append(formatted_response)

    # 3. Create Workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Follow Up Report"

    # Define Styles
    header_font = Font(bold=True, size=11, name='Calibri')
    center_align = Alignment(horizontal='center', vertical='center', wrap_text=True)
    content_align = Alignment(horizontal='left', vertical='center', wrap_text=True, indent=1)
    thin_border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

    # Set Column Widths (Adjusted for better readability and padding)
    ws.column_dimensions['A'].width = 10  # Sl No
    ws.column_dimensions['B'].width = 40  # Date & Subject
    ws.column_dimensions['C'].width = 30  # Depts
    ws.column_dimensions['D'].width = 80  # Description
    ws.column_dimensions['E'].width = 60  # Responses

    # Create headers
    headers = [
        "ക്രമ നമ്പർ", 
        "ഉന്നയിച്ച തീയതി & വകുപ്പ്/വിഷയം", 
        "നടപടി സ്വീകരിക്കേണ്ട ഉദ്യോഗസ്ഥൻ",
        "മുൻ യോഗത്തിൽ ചർച്ച ചെയ്തതും യോഗ നിർദ്ദേശവും", 
        "നിലവിലെ സ്റ്റാറ്റസ്"
    ]
    
    # 3.5. Determine Meeting Date for Header
    meeting_date_str = timezone.now().strftime("%d-%m-%Y")
    for item in items:
        if item.issue and item.issue.minutes and item.issue.minutes.meeting_date:
            meeting_date_str = item.issue.minutes.meeting_date.strftime("%d-%m-%Y")
            break

    # Main Header Row
    ws.merge_cells('A1:E1')
    main_header = ws['A1']
    main_header.value = f"{meeting_date_str} -ന് ചേർന്ന ജില്ലാ വികസന സമിതി യോഗത്തിന്റെ തുടർ നടപടി റിപ്പോർട്ട്"
    main_header.font = Font(bold=True, size=12, name='Calibri')
    main_header.alignment = Alignment(horizontal='center', vertical='center')
    main_header.border = thin_border
    ws.row_dimensions[1].height = 30

    # Table Headers (now on row 2)
    ws.append(headers)

    # Apply Table Header Style
    for cell in ws[2]:
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border
        ws.row_dimensions[2].height = 45

    # 4. Write Grouped Data to Excel
    for index, (issue_id, data) in enumerate(grouped_data.items(), start=1):
        issue = data['issue']
        
        # Join Departments with newlines
        dept_str = "\n".join(data['depts'])
        
        # Join Responses with double newlines for readability
        response_str = "\n\n".join(data['responses'])

        # Format Date
        meeting_date = ""
        if issue.minutes and issue.minutes.meeting_date:
            meeting_date = issue.minutes.meeting_date.strftime("%d-%m-%Y")

        subject_col_text = f"തീയതി: {meeting_date}\n\n{issue.issue_title}"

        row_data = [
            index,                  # Sl No
            subject_col_text,       # Date & Subject
            dept_str,               # Departments (Combined)
            issue.issue_description,# Description
            response_str            # Responses (Combined)
        ]
        
        ws.append(row_data)

        # Apply Styling
        current_row = ws.max_row
        for cell in ws[current_row]:
            cell.alignment = content_align
            cell.border = thin_border

    # 5. Return File
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="Follow_Up_Report.xlsx"'
    wb.save(response)
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_overdue_alerts(request):
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Unauthorized"}, status=403)
    
    sent_count = check_and_send_overdue_emails()
    
    return Response({
        "success": True,
        "sent_count": sent_count
    })