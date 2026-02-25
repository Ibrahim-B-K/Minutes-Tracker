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
import httpx
import requests
import uuid
from urllib.parse import quote

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
from .gemini_utils import analyze_document_with_gemini, match_issues_with_gemini
import os
from datetime import datetime, date, timedelta
import io
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ================= SUPABASE STORAGE CONFIG ================= #
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
SUPABASE_BUCKET = os.getenv('SUPABASE_BUCKET_NAME', 'Mnutes')

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
    meeting_date_str = request.POST.get('meeting_date')
    
    if not file:
        return Response({"error": "File required"}, status=400)

    # Save file locally temporarily for Gemini analysis
    os.makedirs('media/minutes', exist_ok=True)
    local_file_path = f"media/minutes/{file.name}"

    with open(local_file_path, 'wb+') as dest:
        for chunk in file.chunks():
            dest.write(chunk)

    # Analyze with Gemini
    raw_data = analyze_document_with_gemini(local_file_path)

    # Upload to Supabase Storage
    supabase_file_path = None
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            with open(local_file_path, 'rb') as f:
                file_data = f.read()
            
            # Generate unique filename to avoid collisions
            file_name = f"{uuid.uuid4()}_{file.name}"
            # Upload to public/ folder (required by RLS policy)
            supabase_file_path = f"public/{file_name}"
            
            # URL-encode the file path to handle spaces and special characters
            encoded_file_path = quote(supabase_file_path, safe='/')
            
            # Supabase Storage REST API endpoint
            upload_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{encoded_file_path}"
            
            # Use apikey header for Supabase Storage API
            headers = {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/octet-stream'
            }
            
            print(f"📤 Uploading to Supabase: {upload_url}")
            response = requests.put(upload_url, data=file_data, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Generate public URL for viewing/downloading
                public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{encoded_file_path}"
                print(f"✅ File uploaded to Supabase successfully!")
                print(f"   Public URL: {public_url}")
            else:
                print(f"⚠️ Supabase upload failed: {response.status_code}")
                print(f"   Response: {response.text}")
                supabase_file_path = None
        except Exception as e:
            print(f"⚠️ Supabase upload exception: {e}")
            supabase_file_path = None

    clean_data = []
    for item in raw_data:
        depts = item.get('departments') or []
        if not depts:
            depts = [item.get('department', 'GENERAL')]

        item['department'] = ", ".join(d.upper() for d in depts if d)
        clean_data.append(item)

    # ===== CREATE MINUTES RECORD NOW (not waiting for allocate_all) ===== #
    # Get or create DPO user
    u_by = User.objects.filter(role='DPO').first()
    if not u_by:
        u_by = User.objects.first()
    if not u_by:
        u_by = User.objects.create_user(username='dpo', password='dpo', role='DPO')
    # Parse meeting date if provided
    try:
        if meeting_date_str:
            # Handle dd-mm-yyyy format
            parts = meeting_date_str.split('-')
            if len(parts) == 3:
                meeting_date_obj = datetime.strptime(meeting_date_str, '%d-%m-%Y').date()
            else:
                meeting_date_obj = timezone.now().date()
        else:
            meeting_date_obj = timezone.now().date()
    except:
        meeting_date_obj = timezone.now().date()
    
    # Create file_path for database (full URL if Supabase, local path if not)
    if supabase_file_path:
        file_path_for_db = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{supabase_file_path}"
    else:
        file_path_for_db = local_file_path
    
    # Create Minutes record IMMEDIATELY
    minute_obj = Minutes.objects.create(
        title=file.name,  # Use actual filename as title
        meeting_date=meeting_date_obj,
        uploaded_by=u_by,
        file_path=file_path_for_db
    )
    
    print(f"✅ Minutes record created: ID {minute_obj.id}, Title: {file.name}")
    # ===== END NEW ===== #

    # Store file path and minutes ID in TEMP_DATA_CACHE for the allocate step
    TEMP_DATA_CACHE = {
        'file_path': supabase_file_path or local_file_path,
        'is_supabase': supabase_file_path is not None,
        'issues': clean_data,
        'minutes_id': minute_obj.id  # Store the minutes ID
    }
    
    return Response({"success": True, "data": clean_data, "minutes_id": minute_obj.id})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_assign_issues(request):
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Unauthorized"}, status=403)
    # Return only issues, not the file_path
    if isinstance(TEMP_DATA_CACHE, dict) and 'issues' in TEMP_DATA_CACHE:
        return Response(TEMP_DATA_CACHE['issues'])
    return Response(TEMP_DATA_CACHE)


# ================= ISSUE ALLOCATION ================= #

def _resolve_minutes_id(request):
    request_minutes_id = request.data.get('minutes_id') or request.data.get('minutesId')
    try:
        minutes_id = int(request_minutes_id) if request_minutes_id not in [None, '', 'null', 'undefined'] else None
    except (TypeError, ValueError):
        minutes_id = None

    if minutes_id is None and isinstance(TEMP_DATA_CACHE, dict):
        minutes_id = TEMP_DATA_CACHE.get('minutes_id')

    return minutes_id


def _resolve_minutes_obj(minutes_id):
    if not minutes_id:
        return None, Response({"error": "minutes_id is required for allocation."}, status=400)

    try:
        minute_obj = Minutes.objects.get(id=minutes_id)
        return minute_obj, None
    except Minutes.DoesNotExist:
        return None, Response({"error": "Minutes record not found. Please upload file again."}, status=400)


def _parse_deadline(item):
    """Parse deadline from item data, defaulting to 14 days from today."""
    raw = item.get('deadline', '')
    if raw and raw.strip():
        try:
            # Handle DD-MM-YYYY format from frontend
            parts = raw.strip().split('-')
            if len(parts) == 3:
                return date(int(parts[2]), int(parts[1]), int(parts[0]))
        except (ValueError, IndexError):
            pass
    return date.today() + timedelta(days=14)


def _create_issues_for_minutes(minute_obj, issues_data):
    dept_counts = {}

    for item in issues_data:
        issue_title = item.get('issue', 'No Title')

        # Resolve parent_issue if provided
        parent_issue_id = item.get('parent_issue_id')
        parent_issue_obj = None
        if parent_issue_id:
            try:
                parent_issue_obj = Issue.objects.get(id=int(parent_issue_id))
                # Star topology: always point to the root
                if parent_issue_obj.parent_issue_id:
                    parent_issue_obj = parent_issue_obj.parent_issue
            except (Issue.DoesNotExist, ValueError, TypeError):
                parent_issue_obj = None

        # Use update_or_create to avoid duplicates when re-allocating from drafts.
        # Match on minutes + issue_title to find existing issues.
        issue, created = Issue.objects.update_or_create(
            minutes=minute_obj,
            issue_title=issue_title,
            defaults={
                'issue_no': str(item.get('issue_no', '')),
                'issue_description': item.get('issue_description', ''),
                'location': item.get('location', ''),
                'priority': item.get('priority', 'Medium'),
                'parent_issue': parent_issue_obj,
            }
        )

        dept_list = [
            d.strip().upper()
            for d in str(item.get('department', 'GENERAL')).split(',')
            if d.strip()
        ]

        d_date = _parse_deadline(item)

        for dept_name in dept_list:
            safe_dept_name = dept_name[:100]
            dept, _ = Department.objects.get_or_create(dept_name=safe_dept_name)

            # Use update_or_create for IssueDepartment too, so re-allocation
            # updates the existing assignment instead of creating a duplicate.
            _issue_dept, id_created = IssueDepartment.objects.update_or_create(
                issue=issue,
                department=dept,
                defaults={
                    'deadline_date': d_date,
                    'status': 'pending',
                }
            )

            # Only count as new assignment if the IssueDepartment was just created
            if id_created:
                dept_counts[dept] = dept_counts.get(dept, 0) + 1

    # Only send notifications for genuinely new assignments
    for dept, count in dept_counts.items():
        users = User.objects.filter(department=dept).exclude(role__in=['DPO', 'COLLECTOR'])
        for u in users:
            Notification.objects.create(
                user=u,
                issue_department=None,
                message=f"ACTION REQUIRED: {count} new issues have been assigned to your department."
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def allocate_single(request):
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Only DPO can allocate"}, status=403)

    issue_item = request.data.get('issue')
    if not isinstance(issue_item, dict):
        return Response({"error": "issue payload is required."}, status=400)

    minutes_id = _resolve_minutes_id(request)
    minute_obj, err = _resolve_minutes_obj(minutes_id)
    if err:
        return err

    _create_issues_for_minutes(minute_obj, [issue_item])
    return Response({"success": True, "allocated": 1})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def allocate_all(request):
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Only DPO can allocate"}, status=403)

    global TEMP_DATA_CACHE

    issues_data = request.data.get('issues', [])
    if not issues_data and isinstance(TEMP_DATA_CACHE, dict):
        issues_data = TEMP_DATA_CACHE.get('issues', [])
    elif not issues_data and isinstance(TEMP_DATA_CACHE, list):
        issues_data = TEMP_DATA_CACHE

    if not isinstance(issues_data, list) or len(issues_data) == 0:
        return Response({"error": "No issues provided for allocation."}, status=400)

    minutes_id = _resolve_minutes_id(request)
    minute_obj, err = _resolve_minutes_obj(minutes_id)
    if err:
        return err

    _create_issues_for_minutes(minute_obj, issues_data)

    TEMP_DATA_CACHE = []
    return Response({"success": True, "allocated": len(issues_data)})


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
    issues_query = Issue.objects.select_related(
        'minutes'
    ).prefetch_related(
        'issuedepartment_set',
        'issuedepartment_set__department'
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
    # 1. Parse request data sent from the frontend modal
    req_format = request.data.get('format', 'excel')
    reports_data = request.data.get('reports', [])

    # Fallback just in case no data was sent (backward compatibility)
    if not reports_data:
        return Response({"error": "No report data provided."}, status=400)

    # ==========================================
    #             PDF GENERATION
    # ==========================================
    if req_format == 'pdf':
        buffer = io.BytesIO()
        # Set to Landscape A4 for TV Presentation
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        elements = []
        styles = getSampleStyleSheet()
        
        # --- REGISTER MALAYALAM FONT ---
        import os
        from django.conf import settings
        
        # Adjust path if you placed the font somewhere else
        font_path = os.path.join(settings.BASE_DIR, 'font', 'NotoSansMalayalam-Regular.ttf') 
        
        try:
            pdfmetrics.registerFont(TTFont('MalayalamFont', font_path))
            font_name = 'MalayalamFont'
        except Exception as e:
            print(f"Font loading error: {e}")
            font_name = 'Helvetica' # Fallback if font isn't found

        # Presentation Styles
        issue_no_style = ParagraphStyle(
            'IssueNo', parent=styles['Normal'], fontName=font_name, fontSize=18,
            textColor=colors.white, backColor=colors.HexColor('#1E3A8A'),
            borderPadding=8, spaceAfter=20
        )
        issue_text_style = ParagraphStyle(
            'IssueText', parent=styles['Normal'], fontName=font_name, fontSize=24,
            leading=34, spaceAfter=40
        )
        dept_style = ParagraphStyle(
            'DeptText', parent=styles['Normal'], fontName=font_name, fontSize=18,
            textColor=colors.red, alignment=2 # 2 = Right aligned
        )
        response_header_style = ParagraphStyle(
            'ResponseHeader', parent=styles['Normal'], fontName=font_name, fontSize=22,
            textColor=colors.white, backColor=colors.HexColor('#0284c7'), # Lighter blue
            borderPadding=10, spaceAfter=20
        )
        response_text_style = ParagraphStyle(
            'ResponseText', parent=styles['Normal'], fontName=font_name, fontSize=22,
            leading=32, spaceAfter=20
        )

        for report in reports_data:
            # --- SLIDE 1: THE ISSUE ---
            issue_title = report.get('issue_no', 'Unknown Issue')
            elements.append(Paragraph(f"Issue: {issue_title}", issue_no_style))
            
            issue_desc = report.get('issue', '')
            elements.append(Paragraph(issue_desc, issue_text_style))
            
            dept_name = report.get('department', '')
            elements.append(Paragraph(f"{dept_name}", dept_style))
            
            # --- SLIDE 2: THE RESPONSE ---
            elements.append(PageBreak()) 
            
            elements.append(Paragraph("നിലവിലെ അവസ്ഥ / Action Taken", response_header_style))
            
            response_text = report.get('response', 'No response yet')
            # Split response by newlines so it formats nicely
            for para in response_text.split('\n'):
                if para.strip():
                    elements.append(Paragraph(para.strip(), response_text_style))
                    elements.append(Spacer(1, 10))

            # Move to next issue
            elements.append(PageBreak())

        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="DDC_Presentation.pdf"'
        response.write(pdf)
        return response

    # ==========================================
    #            EXCEL GENERATION
    # ==========================================
    else:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Follow Up Report"

        header_font = Font(bold=True, size=11, name='Calibri')
        center_align = Alignment(horizontal='center', vertical='center', wrap_text=True)
        content_align = Alignment(horizontal='left', vertical='center', wrap_text=True, indent=1)
        thin_border = Border(left=Side(style='thin'), right=Side(style='thin'), top=Side(style='thin'), bottom=Side(style='thin'))

        ws.column_dimensions['A'].width = 10  
        ws.column_dimensions['B'].width = 40  
        ws.column_dimensions['C'].width = 30  
        ws.column_dimensions['D'].width = 80  
        ws.column_dimensions['E'].width = 60  

        headers = [
            "ക്രമ നമ്പർ", 
            "ഉന്നയിച്ച തീയതി & വകുപ്പ്/വിഷയം", 
            "നടപടി സ്വീകരിക്കേണ്ട ഉദ്യോഗസ്ഥൻ",
            "മുൻ യോഗത്തിൽ ചർച്ച ചെയ്തതും യോഗ നിർദ്ദേശവും", 
            "നിലവിലെ സ്റ്റാറ്റസ്"
        ]
        
        meeting_date_str = timezone.now().strftime("%d-%m-%Y")

        ws.merge_cells('A1:E1')
        main_header = ws['A1']
        main_header.value = f"{meeting_date_str} -ന് ചേർന്ന ജില്ലാ വികസന സമിതി യോഗത്തിന്റെ തുടർ നടപടി റിപ്പോർട്ട്"
        main_header.font = Font(bold=True, size=12, name='Calibri')
        main_header.alignment = Alignment(horizontal='center', vertical='center')
        main_header.border = thin_border
        ws.row_dimensions[1].height = 30

        ws.append(headers)

        for cell in ws[2]:
            cell.font = header_font
            cell.alignment = center_align
            cell.border = thin_border
            ws.row_dimensions[2].height = 45

        # Populate Excel with the EDITED data from the frontend
        for index, report in enumerate(reports_data, start=1):
            subject_col_text = f"തീയതി: {meeting_date_str}\n\n{report.get('issue_no', '')}"

            row_data = [
                index,
                subject_col_text,
                report.get('department', ''),
                report.get('issue', ''),
                report.get('response', '')
            ]
            ws.append(row_data)

            current_row = ws.max_row
            for cell in ws[current_row]:
                cell.alignment = content_align
                cell.border = thin_border

        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def resolve_issue(request, issue_id):
    """Toggle resolution_status between resolved/unresolved."""
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Only DPO can resolve issues"}, status=403)

    try:
        issue = Issue.objects.get(id=issue_id)
    except Issue.DoesNotExist:
        return Response({"error": "Issue not found"}, status=404)

    new_status = request.data.get('resolution_status')
    if new_status not in ('resolved', 'unresolved'):
        return Response({"error": "Invalid status. Use 'resolved' or 'unresolved'."}, status=400)

    issue.resolution_status = new_status
    issue.save(update_fields=['resolution_status'])

    return Response({
        "success": True,
        "id": issue.id,
        "resolution_status": issue.resolution_status
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_issue_lifecycle(request, issue_id):
    """Return lifecycle chain for a given issue with optional filters."""
    if request.user.role.lower() not in ['dpo', 'collector']:
        return Response({"error": "Unauthorized"}, status=403)

    try:
        target_issue = Issue.objects.select_related('parent_issue').get(id=issue_id)
    except Issue.DoesNotExist:
        return Response({"error": "Issue not found"}, status=404)

    root_issue = target_issue
    seen = set()
    while root_issue.parent_issue_id and root_issue.id not in seen:
        seen.add(root_issue.id)
        parent = root_issue.parent_issue
        if not parent:
            break
        root_issue = parent

    lifecycle_qs = Issue.objects.select_related(
        'minutes', 'parent_issue'
    ).prefetch_related(
        'issuedepartment_set',
        'issuedepartment_set__department',
        'issuedepartment_set__responses'
    ).filter(
        Q(id=root_issue.id) | Q(parent_issue_id=root_issue.id)
    )

    serialized_items = list(DPOIssueSerializer(lifecycle_qs, many=True).data)

    status_filter = (request.query_params.get('status') or '').strip().lower()
    department_filter = (request.query_params.get('department') or '').strip().lower()
    search_filter = (request.query_params.get('search') or '').strip().lower()
    from_date = (request.query_params.get('from_date') or '').strip()
    to_date = (request.query_params.get('to_date') or '').strip()
    has_response = (request.query_params.get('has_response') or '').strip().lower()

    def normalized_status(value):
        s = str(value or 'pending').lower().strip()
        if s in ['submitted', 'completed', 'received']:
            return 'received'
        if s == 'overdue':
            return 'overdue'
        return 'pending'

    def in_date_range(item_date):
        if not item_date:
            return not (from_date or to_date)
        date_part = str(item_date)[:10]
        try:
            item_dt = datetime.strptime(date_part, '%Y-%m-%d').date()
        except ValueError:
            return True

        if from_date:
            try:
                from_dt = datetime.strptime(from_date, '%Y-%m-%d').date()
                if item_dt < from_dt:
                    return False
            except ValueError:
                pass

        if to_date:
            try:
                to_dt = datetime.strptime(to_date, '%Y-%m-%d').date()
                if item_dt > to_dt:
                    return False
            except ValueError:
                pass

        return True

    filtered_items = []
    for item in serialized_items:
        item_status = normalized_status(item.get('status'))
        item_department = str(item.get('department') or '').lower()
        item_search_blob = ' '.join([
            str(item.get('issue') or ''),
            str(item.get('issue_description') or ''),
            str(item.get('minutes_title') or ''),
            str(item.get('issue_no') or ''),
        ]).lower()
        responses = item.get('response') or []

        if status_filter and status_filter != 'all' and item_status != status_filter:
            continue
        if department_filter and department_filter != 'all' and department_filter not in item_department:
            continue
        if search_filter and search_filter not in item_search_blob:
            continue
        if not in_date_range(item.get('meeting_date')):
            continue
        if has_response == 'true' and len(responses) == 0:
            continue
        if has_response == 'false' and len(responses) > 0:
            continue

        filtered_items.append(item)

    filtered_items.sort(key=lambda item: (
        str(item.get('meeting_date') or ''),
        str(item.get('created_at') or ''),
        int(item.get('id') or 0),
    ))

    return Response({
        'issue_id': target_issue.id,
        'issue_no': target_issue.issue_no,
        'root_issue_id': root_issue.id,
        'root_issue_no': root_issue.issue_no,
        'total_iterations': len(serialized_items),
        'filtered_iterations': len(filtered_items),
        'items': filtered_items,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_existing_issues(request):
    """Return all existing issues for the flag panel on the allocation page."""
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Unauthorized"}, status=403)

    issues = Issue.objects.select_related('minutes').filter(resolution_status='unresolved').order_by('-id')

    result = []
    for iss in issues:
        # Get departments for this issue
        depts = ", ".join(
            a.department.dept_name
            for a in iss.issuedepartment_set.select_related('department').all()
        )
        result.append({
            'id': iss.id,
            'issue': iss.issue_title,
            'issue_description': iss.issue_description,
            'issue_no': iss.issue_no,
            'minutes_title': iss.minutes.title if iss.minutes else '',
            'minutes_id': iss.minutes.id if iss.minutes else None,
            'meeting_date': iss.minutes.meeting_date.isoformat() if iss.minutes and iss.minutes.meeting_date else None,
            'department': depts,
            'location': iss.location,
        })

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def match_issues(request):
    """Use Gemini to suggest matches between new and existing issues."""
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Unauthorized"}, status=403)

    new_issues = request.data.get('new_issues', [])
    existing_issues = request.data.get('existing_issues', [])

    if not new_issues or not existing_issues:
        return Response([])

    matches = match_issues_with_gemini(new_issues, existing_issues)
    return Response(matches)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_minutes(request):
    """Fetch all uploaded minutes - accessible to DPO and Department users"""
    # Allow both DPO and department users to view
    if request.user.role.lower() not in ['dpo', 'department', 'collector']:
        return Response({"error": "Unauthorized to view minutes"}, status=403)
    
    minutes = Minutes.objects.all().order_by('-created_at').prefetch_related('issues')
    
    minutes_data = []
    for m in minutes:
        # Convert FieldFile to string
        file_path_str = str(m.file_path) if m.file_path else None
        
        # file_path is already a full URL if from Supabase, or a local path if not
        file_url = file_path_str
        if file_url and not file_url.startswith('http'):
            # Local file - add /media/ prefix
            file_url = f"/media/{file_url}"
        
        # Extract original filename from the file path
        # For Supabase files: "public/uuid_filename.pdf" -> "filename.pdf"
        # For local files: "media/minutes/filename.pdf" -> "filename.pdf"
        original_filename = file_path_str
        if original_filename and '_' in original_filename:
            # Extract filename after UUID prefix
            original_filename = original_filename.split('_', 1)[1]
        elif original_filename:
            # Extract just the filename from path
            original_filename = original_filename.split('/')[-1]
        
        minutes_data.append({
            'id': m.id,
            'title': m.title,
            'originalFileName': original_filename,
            'uploadedDate': m.created_at.isoformat(),
            'meetingDate': m.meeting_date.isoformat() if m.meeting_date else None,
            'fileUrl': file_url,
            'uploadedBy': m.uploaded_by.username if m.uploaded_by else 'Unknown',
            'issueCount': m.issues.count()
        })
    
    return Response(minutes_data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_minutes(request, minutes_id):
    """Delete a Minutes record"""
    if request.user.role.lower() != 'dpo':
        return Response({"error": "Only DPO can delete minutes"}, status=403)
    
    try:
        minute = Minutes.objects.get(id=minutes_id)
        
        # Get original filename for response
        file_path_str = str(minute.file_path) if minute.file_path else "Unknown"
        original_filename = file_path_str
        if original_filename and '_' in original_filename:
            original_filename = original_filename.split('_', 1)[1]
        elif original_filename:
            original_filename = original_filename.split('/')[-1]
        
        print(f"🗑️  Deleting Minutes: {original_filename} (ID: {minutes_id})")
        
        # Delete the minute and associated issues
        minute.delete()
        
        return Response({
            "success": True,
            "message": f"Deleted: {original_filename}"
        })
    
    except Minutes.DoesNotExist:
        return Response({"error": "Minutes record not found"}, status=404)
    except Exception as e:
        print(f"❌ Error deleting minutes: {e}")
        return Response({"error": str(e)}, status=500)















