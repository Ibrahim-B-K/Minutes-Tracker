from django.db import migrations


def _load_department_rows(schema_editor):
    connection = schema_editor.connection
    table_names = set(connection.introspection.table_names())

    rows = []
    with connection.cursor() as cursor:
        if 'new_depts' in table_names:
            cursor.execute('SELECT "Department" FROM new_depts')
            rows = [r[0] for r in cursor.fetchall()]
        elif 'depts_only' in table_names:
            cursor.execute('SELECT "Department" FROM depts_only')
            rows = [r[0] for r in cursor.fetchall()]

    cleaned = []
    seen = set()
    for value in rows:
        name = (value or '').strip()
        if not name:
            continue
        key = name.upper()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(name[:100])
    return cleaned


def seed_department_master(apps, schema_editor):
    Department = apps.get_model('api', 'Department')
    department_names = _load_department_rows(schema_editor)

    if not department_names:
        return

    Department.objects.all().delete()
    Department.objects.bulk_create([
        Department(dept_name=name) for name in department_names
    ])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0009_issue_resolution_status'),
    ]

    operations = [
        migrations.RunPython(seed_department_master, migrations.RunPython.noop),
    ]
