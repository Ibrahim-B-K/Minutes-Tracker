from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from rest_framework.authtoken.models import Token

from .models import User


@receiver(pre_save, sender=User)
def mark_password_change(sender, instance, **kwargs):
    if not instance.pk:
        instance._password_changed = False
        return

    try:
        current = sender.objects.only('password').get(pk=instance.pk)
    except sender.DoesNotExist:
        instance._password_changed = False
        return

    instance._password_changed = current.password != instance.password


@receiver(post_save, sender=User)
def revoke_tokens_on_user_change(sender, instance, **kwargs):
    if not instance.is_active or getattr(instance, '_password_changed', False):
        Token.objects.filter(user=instance).delete()
