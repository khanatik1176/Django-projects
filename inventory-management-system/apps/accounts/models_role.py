from django.db import models


class Role(models.Model):
    """Configurable access role for Bhandar users."""

    name = models.CharField(max_length=80, unique=True)
    code = models.CharField(max_length=30, unique=True)
    description = models.TextField(blank=True)
    can_manage_users = models.BooleanField(default=False)
    can_manage_config = models.BooleanField(default=False)
    can_manage_inventory = models.BooleanField(default=True)
    can_manage_orders = models.BooleanField(default=True)
    can_view_reports = models.BooleanField(default=True)
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "roles"
        ordering = ["name"]

    def __str__(self):
        return self.name
