from django.db import models
from django.utils import timezone

from core.models.audit import AuditModel

from apps.products.models import Supplier
from apps.inventory.models import Warehouse


class PurchaseOrderStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft"
    SUBMITTED = "SUBMITTED", "Submitted"
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED", "Partially Received"
    RECEIVED = "RECEIVED", "Received"
    CANCELLED = "CANCELLED", "Cancelled"


class PurchaseOrder(AuditModel):

    po_number = models.CharField(max_length=30, unique=True)
    supplier = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="purchase_orders",
    )
    status = models.CharField(
        max_length=25,
        choices=PurchaseOrderStatus.choices,
        default=PurchaseOrderStatus.DRAFT,
    )
    order_date = models.DateField(default=timezone.localdate)
    expected_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "purchase_orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.po_number} ({self.status})"

    @property
    def total_ordered(self):
        return sum(item.quantity_ordered for item in self.items.all())

    @property
    def total_received(self):
        return sum(item.quantity_received for item in self.items.all())

    @property
    def total_cost(self):
        return sum(item.line_total for item in self.items.all())
