from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings

from .models import IssueDepartment, User


def check_and_send_overdue_emails():
    today = timezone.now().date()
    sent_count = 0

    # Get only PENDING items that are now overdue
    overdue_entries = IssueDepartment.objects.filter(
        deadline_date__lt=today,
        status__iexact="pending"
    )

    for entry in overdue_entries:

        # 1️⃣ Change status to OVERDUE
        entry.status = "overdue"
        entry.save()

        # 2️⃣ Get department users
        users = User.objects.filter(
            department=entry.department,
            role="department"
        )

        # 3️⃣ Send one email per user for THIS IssueDepartment
        for user in users:

            subject = f"Overdue Issue: {entry.issue.issue_title}"

            context = {
                "user": user,
                "department": entry.department,
                "issue": entry,
            }

            text_content = render_to_string(
                "emails/overdue_issue.txt",
                context
            )

            html_content = render_to_string(
                "emails/overdue_issue.html",
                context
            )

            email = EmailMultiAlternatives(
                subject,
                text_content,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
            )

            email.attach_alternative(html_content, "text/html")
            email.send()
            sent_count += 1
    
    return sent_count
