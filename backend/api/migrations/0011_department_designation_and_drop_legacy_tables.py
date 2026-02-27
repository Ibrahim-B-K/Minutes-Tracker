from django.db import migrations, models


def _normalize(value):
    return ''.join(ch for ch in (value or '').strip().lower() if ch.isalnum())


def _pick_column_index(columns, candidates):
    normalized = {_normalize(col): idx for idx, col in enumerate(columns)}
    for candidate in candidates:
        key = _normalize(candidate)
        if key in normalized:
            return normalized[key]
    return None


def populate_designation_from_legacy(apps, schema_editor):
    Department = apps.get_model('api', 'Department')
    connection = schema_editor.connection
    table_names = set(connection.introspection.table_names())

    if 'new_depts' not in table_names:
        return

    with connection.cursor() as cursor:
        cursor.execute('SELECT * FROM new_depts')
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]

    dept_index = _pick_column_index(columns, ['Department'])
    designation_index = _pick_column_index(columns, ['Designation', 'Category'])

    if dept_index is None or designation_index is None:
        return

    designation_map = {}
    for row in rows:
        department_name = (row[dept_index] or '').strip()
        designation = (row[designation_index] or '').strip()
        if not department_name:
            continue
        designation_map[department_name.upper()] = designation[:150]

    for department in Department.objects.all():
        designation = designation_map.get((department.dept_name or '').strip().upper(), '')
        if designation and department.designation != designation:
            department.designation = designation
            department.save(update_fields=['designation'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0010_seed_department_master'),
    ]

    operations = [
        migrations.AddField(
            model_name='department',
            name='designation',
            field=models.CharField(blank=True, default='', max_length=150),
        ),
        migrations.RunPython(populate_designation_from_legacy, migrations.RunPython.noop),
        migrations.RunSQL('DROP TABLE IF EXISTS new_depts CASCADE;', reverse_sql=migrations.RunSQL.noop),
        migrations.RunSQL('DROP TABLE IF EXISTS depts_only CASCADE;', reverse_sql=migrations.RunSQL.noop),
    ]
