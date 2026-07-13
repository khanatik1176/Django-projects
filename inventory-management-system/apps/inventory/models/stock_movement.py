from decimal import Decimal

from django.db import models

from core.models.audit import AuditModel

from apps.products.models import Product

from .warehouse import Warehouse


class MovementType(models.TextChoices):
    RECEIPT = "RECEIPT", "Receipt"
    ISSUE = "ISSUE", "Issue"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"
    TRANSFER_IN = "TRANSFER_IN", "Transfer In"
    TRANSFER_OUT = "TRANSFER_OUT", "Transfer Out"


class StockMovement(AuditModel):
    """Immutable audit trail for every inventory quantity change."""

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_movements",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="stock_movements",
    )
    movement_type = models.CharField(max_length=20, choices=MovementType.choices)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_before = models.DecimalField(max_digits=12, decimal_places=2)
    quantity_after = models.DecimalField(max_digits=12, decimal_places=2)
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    stock_transfer = models.ForeignKey(
        "inventory.StockTransfer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movements",
    )

    class Meta:
        db_table = "inventory_stock_movements"
        ordering = ["-created_at"]
        verbose_name = "Stock Movement"
        verbose_name_plural = "Stock Movements"

    def __str__(self):
        return f"{self.movement_type} {self.quantity} - {self.product.sku}"
