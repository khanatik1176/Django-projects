from django.db import models

from core.models.audit import AuditModel


class Warehouse(AuditModel):
    """Physical storage location for inventory."""

    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True)
    address = models.TextField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "inventory_warehouses"
        ordering = ["name"]
        verbose_name = "Warehouse"
        verbose_name_plural = "Warehouses"

    def __str__(self):
        return f"{self.code} - {self.name}"

    def save(self, *args, **kwargs):
        if self.is_default:
            Warehouse.objects.filter(is_default=True).exclude(pk=self.pk).update(
                is_default=False
            )
        super().save(*args, **kwargs)
