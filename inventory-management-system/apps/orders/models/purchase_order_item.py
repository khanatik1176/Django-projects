from decimal import Decimal

from django.db import models

from core.models.audit import AuditModel

from apps.products.models import Product

from .purchase_order import PurchaseOrder


class PurchaseOrderItem(AuditModel):

    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="purchase_order_items",
    )
    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_received = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
    )
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    class Meta:
        db_table = "purchase_order_items"
        ordering = ["id"]

    def __str__(self):
        return f"{self.purchase_order.po_number} - {self.product.sku}"

    @property
    def quantity_remaining(self):
        return self.quantity_ordered - self.quantity_received

    @property
    def line_total(self):
        return self.quantity_ordered * self.unit_cost

    @property
    def is_fully_received(self):
        return self.quantity_received >= self.quantity_ordered
