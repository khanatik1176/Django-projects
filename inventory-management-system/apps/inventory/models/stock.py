from decimal import Decimal

from django.db import models

from core.models.audit import AuditModel

from apps.products.models import Product

from .warehouse import Warehouse


class Stock(AuditModel):
    """On-hand inventory for a product at a specific warehouse."""

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_records",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="stock_records",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    reserved_quantity = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
    )
    reorder_level = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
    )
    max_stock_level = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "inventory_stock"
        ordering = ["product__name"]
        verbose_name = "Stock"
        verbose_name_plural = "Stock"
        constraints = [
            models.UniqueConstraint(
                fields=["product", "warehouse"],
                name="unique_product_warehouse_stock",
            ),
        ]

    def __str__(self):
        return f"{self.product.sku} @ {self.warehouse.code}: {self.quantity}"

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self):
        if self.reorder_level <= 0:
            return False
        return self.quantity <= self.reorder_level
