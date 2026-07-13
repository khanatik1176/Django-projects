from django.db import models
from django.utils import timezone

from core.models.audit import AuditModel

from apps.inventory.models import Warehouse


class SalesOrderStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    CONFIRMED = "CONFIRMED", "Confirmed"
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED", "Partially Fulfilled"
    FULFILLED = "FULFILLED", "Fulfilled"
    CANCELLED = "CANCELLED", "Cancelled"


class SalesOrder(AuditModel):

    so_number = models.CharField(max_length=30, unique=True)
    customer_name = models.CharField(max_length=150)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="sales_orders",
    )
    status = models.CharField(
        max_length=25,
        choices=SalesOrderStatus.choices,
        default=SalesOrderStatus.DRAFT,
    )
    order_date = models.DateField(default=timezone.localdate)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "sales_orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.so_number} ({self.status})"

    @property
    def total_ordered(self):
        return sum(item.quantity_ordered for item in self.items.all())

    @property
    def total_fulfilled(self):
        return sum(item.quantity_fulfilled for item in self.items.all())

    @property
    def total_revenue(self):
        return sum(item.line_total for item in self.items.all())
