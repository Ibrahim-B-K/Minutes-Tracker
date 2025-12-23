import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.apps import apps
User = apps.get_model('api', 'User')
Department = apps.get_model('api', 'Department')

def fix():
    print("Linking Users to Departments...")
    # 1. Ensure the 'police' user is linked to the 'POLICE' department
    police_dept, _ = Department.objects.get_or_create(dept_name='POLICE')
    User.objects.filter(username='police').update(department=police_dept)
    
    # 2. Ensure generic department user exists for demo
    pwd_dept, _ = Department.objects.get_or_create(dept_name='PWD')
    User.objects.filter(username='pwd').update(department=pwd_dept)

    print("✅ Done. Users are now linked. Notifications will now trigger.")

if __name__ == "__main__":
    fix()