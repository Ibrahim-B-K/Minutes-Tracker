from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db.models import Q

from datetime import datetime, date
import os
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side
from django.http import HttpResponse

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
    if request.user.role not in ['dpo', 'collector']:
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
    if request.user.role != 'department':
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
    # 1. Get the ID safely
    issue_id = request.data.get('issue_id') or request.data.get('id')
    response_text = request.data.get('response')

    print(f"📝 Submitting response for ID: {issue_id}") # Debug Log

    if not issue_id or str(issue_id) == "undefined":
        return Response({"error": "Invalid ID provided"}, status=400)

    try:
        # FIX 1: Use 'id' (the database primary key), not 'issue_dept_id'

        issue_link = IssueDepartment.objects.get(id=issue_id)
        
        # FIX 2: Create Response (Using 'issue_department' which matches your model)
        # We use 'create' instead of update_or_create to allow history of responses
        ResponseModel.objects.create(
            issue_department=issue_link, 
            response_text=response_text
        )
        
        # FIX 3: Status must be lowercase 'submitted' to match your frontend logic
        issue_link.status = 'submitted'
        issue_link.save()
        
        # --- NOTIFY DPO ---
        dpos = User.objects.filter(Q(role__iexact='DPO') | Q(username__iexact='dpo'))
        
        # FIX 4: Use 'issue.id' because 'issue_no' column might not exist
        issue_number = issue_link.issue.id 
        dept_name = issue_link.department.dept_name

        for d in dpos:
            Notification.objects.create(
                user=d, 
                issue_department=issue_link,  # FIX 5: Field name is 'issue_department'
                # type='response', # Uncomment only if your Notification model has this field
                message=f"Response Received: {dept_name} responded to Issue #{issue_number}"
            )
            
        print(f"✅ Response success for Issue #{issue_number}")
        return Response({"success": True})

    except IssueDepartment.DoesNotExist:
        print(f"❌ Error: IssueDepartment with ID {issue_id} not found.")
        return Response({"error": "Issue not found"}, status=404)
        
    except Exception as e:
        print(f"🔥 CRITICAL SUBMIT ERROR: {str(e)}") # Prints exact error to terminal
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
    # 1. Fetch only issues that have a response (Submitted/Received)
    # We filter for 'submitted' because that is the status used in  DB when a dept replies
    issues = IssueDepartment.objects.filter(
        status__in=['submitted', 'received', 'completed']
    ).select_related('issue', 'issue__minutes', 'department').prefetch_related('responses')

    # 2. Create the Excel Workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Action Taken Report"

    # 3. Define Styles (to match the official look)
    header_font = Font(bold=True, size=11, name='Calibri')
    # Center align for headers
    center_align = Alignment(horizontal='center', vertical='center', wrap_text=True)
    # Top-Left align for content so it looks like the document
    content_align = Alignment(horizontal='left', vertical='top', wrap_text=True)
    
    thin_border = Border(
        left=Side(style='thin'), right=Side(style='thin'), 
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    # 4. Set Column Widths (Adjusted for the 4-column layout)
    ws.column_dimensions['A'].width = 8   # Sl No
    ws.column_dimensions['B'].width = 25  # Date & Subject
    ws.column_dimensions['C'].width = 20  # Department
    ws.column_dimensions['D'].width = 40  # Instruction (Issue)
    ws.column_dimensions['E'].width = 40  # Current Status (Response)

    # 5. Create the Header Row
    headers = [
        "Sl No.", 
        "Date & Subject\n(തിയതി & വിഷയം)", 
        "Responsible Dept\n(ഉദ്യോഗസ്ഥൻ)", 
        "Decision/Instruction\n(നിർദ്ദേശം)", 
        "Current Status\n(നിലവിലെ സ്റ്റാറ്റസ്)"
    ]
    
    ws.append(headers)

    # Apply style to header row
    for cell in ws[1]:
        cell.font = header_font
        cell.alignment = center_align
        cell.border = thin_border
        # Make header row a bit taller
        ws.row_dimensions[1].height = 40

    # 6. Loop through data and fill rows
    for index, item in enumerate(issues, start=1):
        # A. Get the latest response text
        last_response = item.responses.last()
        response_text = last_response.response_text if last_response else "No status update provided."
        
        # B. Get Meeting Date safely
        meeting_date = "N/A"
        if item.issue.minutes and item.issue.minutes.meeting_date:
            meeting_date = item.issue.minutes.meeting_date.strftime("%d-%m-%Y")
        
        # C. Format Column 1: Date + Issue Title
        # Mimicking the doc: "Date: ... \n (Minutes No...)\n Subject..."
        col_1_text = f"Date: {meeting_date}\n\nSubject:\n{item.issue.issue_title}"

        # D. Construct the row
        row_data = [
            index,                          # Sl No
            col_1_text,                     # Col 1: Date & Subject
            item.department.dept_name,      # Col 2: Dept
            item.issue.issue_description,   # Col 3: The Instruction
            response_text                   # Col 4: The Response
        ]
        
        ws.append(row_data)

        # Apply Styling to the new row
        current_row = ws.max_row
        for cell in ws[current_row]:
            cell.alignment = content_align
            cell.border = thin_border

    # 7. Return the file as a response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="Action_Taken_Report.xlsx"'
    
    wb.save(response)
    return response