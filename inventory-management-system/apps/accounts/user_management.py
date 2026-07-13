from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.accounts.models import AccountStatus, Role, User


DEFAULT_ROLES = [
    {
        "name": "Administrator",
        "code": "ADMIN",
        "description": "Full access including user approval, roles, and system configuration.",
        "can_manage_users": True,
        "can_manage_config": True,
        "can_manage_inventory": True,
        "can_manage_orders": True,
        "can_view_reports": True,
        "is_system": True,
    },
    {
        "name": "Operations Manager",
        "code": "MANAGER",
        "description": "Manage inventory, orders, and reports across warehouses.",
        "can_manage_users": False,
        "can_manage_config": False,
        "can_manage_inventory": True,
        "can_manage_orders": True,
        "can_view_reports": True,
        "is_system": True,
    },
    {
        "name": "Warehouse Staff",
        "code": "WAREHOUSE",
        "description": "Receive stock, fulfill orders, and run day-to-day warehouse tasks.",
        "can_manage_users": False,
        "can_manage_config": False,
        "can_manage_inventory": True,
        "can_manage_orders": True,
        "can_view_reports": False,
        "is_system": True,
    },
    {
        "name": "Viewer",
        "code": "VIEWER",
        "description": "Read-only access to dashboards and stock levels.",
        "can_manage_users": False,
        "can_manage_config": False,
        "can_manage_inventory": False,
        "can_manage_orders": False,
        "can_view_reports": True,
        "is_system": True,
    },
]


class UserManagementService:

    @staticmethod
    def ensure_default_roles():
        for role_data in DEFAULT_ROLES:
            Role.objects.get_or_create(code=role_data["code"], defaults=role_data)

    @staticmethod
    def list_roles():
        return Role.objects.all()

    @staticmethod
    @transaction.atomic
    def create_role(*, name, code, description="", **permissions):
        code = code.upper().strip()
        if Role.objects.filter(code=code).exists():
            raise ValidationError({"code": "Role code already exists."})
        return Role.objects.create(
            name=name.strip(),
            code=code,
            description=description,
            can_manage_users=permissions.get("can_manage_users", False),
            can_manage_config=permissions.get("can_manage_config", False),
            can_manage_inventory=permissions.get("can_manage_inventory", True),
            can_manage_orders=permissions.get("can_manage_orders", True),
            can_view_reports=permissions.get("can_view_reports", True),
            is_system=False,
        )

    @staticmethod
    @transaction.atomic
    def update_role(role_id, **data):
        role = Role.objects.get(pk=role_id)
        if role.is_system and data.get("code") and data["code"] != role.code:
            raise ValidationError({"code": "System role code cannot be changed."})
        for field, value in data.items():
            if hasattr(role, field):
                setattr(role, field, value)
        role.save()
        return role

    @staticmethod
    @transaction.atomic
    def delete_role(role_id):
        role = Role.objects.get(pk=role_id)
        if role.is_system:
            raise ValidationError({"role": "System roles cannot be deleted."})
        if role.users.exists():
            raise ValidationError({"role": "Role is assigned to users and cannot be deleted."})
        role.delete()

    @staticmethod
    def list_users():
        return User.objects.select_related("role").order_by("-created_at")

    @staticmethod
    @transaction.atomic
    def create_user(*, email, password, first_name, last_name, phone="", role_id=None, approved=False):
        email = email.lower().strip()
        if User.objects.filter(email=email).exists():
            raise ValidationError({"email": "Email already exists."})

        role = None
        if role_id:
            role = Role.objects.get(pk=role_id)

        status = AccountStatus.ACTIVE if approved else AccountStatus.PENDING
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=role,
            account_status=status,
            is_active=approved,
        )
        return user

    @staticmethod
    @transaction.atomic
    def update_user(user_id, **data):
        user = User.objects.select_related("role").get(pk=user_id)
        role_id = data.pop("role_id", None)
        if role_id is not None:
            user.role = Role.objects.get(pk=role_id) if role_id else None
        for field in ("first_name", "last_name", "phone"):
            if field in data:
                setattr(user, field, data[field])
        user.save()
        return user

    @staticmethod
    @transaction.atomic
    def approve_user(user_id):
        user = User.objects.get(pk=user_id)
        if user.account_status == AccountStatus.BANNED:
            raise ValidationError({"account_status": "Banned users must be unbanned first."})
        user.account_status = AccountStatus.ACTIVE
        user.is_active = True
        user.save(update_fields=["account_status", "is_active", "updated_at"])
        return user

    @staticmethod
    @transaction.atomic
    def ban_user(user_id):
        user = User.objects.get(pk=user_id)
        if user.is_superuser:
            raise ValidationError({"user": "Superuser accounts cannot be banned."})
        user.account_status = AccountStatus.BANNED
        user.is_active = False
        user.save(update_fields=["account_status", "is_active", "updated_at"])
        return user

    @staticmethod
    @transaction.atomic
    def unban_user(user_id):
        user = User.objects.get(pk=user_id)
        user.account_status = AccountStatus.ACTIVE
        user.is_active = True
        user.save(update_fields=["account_status", "is_active", "updated_at"])
        return user
