import secrets
import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class EmailOTP(models.Model):
    class Purpose(models.TextChoices):
        PASSWORD_RESET = "PASSWORD_RESET", "Password Reset"

    email = models.EmailField(db_index=True)
    code = models.CharField(max_length=6)
    purpose = models.CharField(
        max_length=32,
        choices=Purpose.choices,
        default=Purpose.PASSWORD_RESET,
    )
    reset_token = models.UUIDField(null=True, blank=True, unique=True)
    is_verified = models.BooleanField(default=False)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "accounts_email_otps"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} · {self.purpose}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @classmethod
    def create_for_email(cls, email, purpose=Purpose.PASSWORD_RESET, ttl_minutes=10):
        cls.objects.filter(
            email=email,
            purpose=purpose,
            is_used=False,
        ).update(is_used=True)

        code = f"{secrets.randbelow(1_000_000):06d}"
        return cls.objects.create(
            email=email.lower().strip(),
            code=code,
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
        )

    def mark_verified(self):
        self.is_verified = True
        self.reset_token = uuid.uuid4()
        self.save(update_fields=["is_verified", "reset_token"])
        return str(self.reset_token)
