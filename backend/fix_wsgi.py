import os

# We assume we are in the outer 'backend' folder where manage.py lives.
# We need to target the inner 'backend' folder.
INNER_DIR = 'backend'

if not os.path.exists(INNER_DIR):
    print(f"❌ Error: Could not find the inner '{INNER_DIR}' directory!")
    print("Make sure you are running this from the folder containing manage.py")
    exit(1)

print(f"🔧 Repairing Configuration in: ./{INNER_DIR}/")

# 1. Create/Fix __init__.py (Required for Python to treat this as a package)
init_path = os.path.join(INNER_DIR, '__init__.py')
with open(init_path, 'w', encoding='utf-8') as f:
    f.write("")
print("✅ Restored: __init__.py")

# 2. Create/Fix wsgi.py (The file causing your crash)
wsgi_path = os.path.join(INNER_DIR, 'wsgi.py')
wsgi_content = """
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()
"""
with open(wsgi_path, 'w', encoding='utf-8') as f:
    f.write(wsgi_content.strip())
print("✅ Restored: wsgi.py")

# 3. Create/Fix asgi.py (Good practice)
asgi_path = os.path.join(INNER_DIR, 'asgi.py')
asgi_content = """
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_asgi_application()
"""
with open(asgi_path, 'w', encoding='utf-8') as f:
    f.write(asgi_content.strip())
print("✅ Restored: asgi.py")

print("\n🎉 Repair Complete.")
print("👉 Try running: python manage.py runserver")