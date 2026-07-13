from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class AccountStatus(models.TextChoices):
    PENDING = "PENDING", "Pending Approval"
    ACTIVE = "ACTIVE", "Active"
    BANNED = "BANNED", "Banned"


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True)
    profile_picture = models.ImageField(upload_to="profile/", blank=True, null=True)
    role = models.ForeignKey(
        "accounts.Role",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )
    account_status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.PENDING,
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["first_name", "last_name"]

    def __str__(self):
        return self.email

    @property
    def is_approved(self):
        return self.account_status == AccountStatus.ACTIVE and self.is_active

    @property
    def can_manage_config(self):
        if self.is_superuser:
            return True
        return bool(self.role and self.role.can_manage_config)

    @property
    def can_manage_inventory(self):
        if self.is_superuser:
            return True
        return bool(self.role and self.role.can_manage_inventory)

    @property
    def can_manage_orders(self):
        if self.is_superuser:
            return True
        return bool(self.role and self.role.can_manage_orders)

    @property
    def can_view_reports(self):
        if self.is_superuser:
            return True
        return bool(self.role and self.role.can_view_reports)


from .models_otp import EmailOTP  # noqa: E402
from .models_role import Role  # noqa: E402
