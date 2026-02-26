from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)

        ttl_hours = int(getattr(settings, 'TOKEN_TTL_HOURS', 8) or 0)
        if ttl_hours > 0:
            expires_at = token.created + timedelta(hours=ttl_hours)
            if timezone.now() >= expires_at:
                token.delete()
                raise AuthenticationFailed('Token has expired. Please log in again.')

        return user, token
