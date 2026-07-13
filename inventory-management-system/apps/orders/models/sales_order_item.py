from decimal import Decimal

from django.db import models

from core.models.audit import AuditModel

from apps.products.models import Product

from .sales_order import SalesOrder


class SalesOrderItem(AuditModel):

    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="sales_order_items",
    )
    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_fulfilled = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
    )
    quantity_reserved = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
    )
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))

    class Meta:
        db_table = "sales_order_items"
        ordering = ["id"]

    def __str__(self):
        return f"{self.sales_order.so_number} - {self.product.sku}"

    @property
    def quantity_remaining(self):
        return self.quantity_ordered - self.quantity_fulfilled

    @property
    def line_total(self):
        return self.quantity_ordered * self.unit_price

    @property
    def is_fully_fulfilled(self):
        return self.quantity_fulfilled >= self.quantity_ordered
