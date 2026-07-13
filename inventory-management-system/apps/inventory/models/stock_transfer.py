from decimal import Decimal

from django.db import models

from core.models.audit import AuditModel

from apps.products.models import Product

from .warehouse import Warehouse


class TransferStatus(models.TextChoices):
    PENDING = "PENDING", "Pending"
    COMPLETED = "COMPLETED", "Completed"
    CANCELLED = "CANCELLED", "Cancelled"


class StockTransfer(AuditModel):
    """Inter-warehouse stock transfer request."""

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_transfers",
    )
    from_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="outgoing_transfers",
    )
    to_warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="incoming_transfers",
    )
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=TransferStatus.choices,
        default=TransferStatus.PENDING,
    )
    reference_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "inventory_stock_transfers"
        ordering = ["-created_at"]
        verbose_name = "Stock Transfer"
        verbose_name_plural = "Stock Transfers"

    def __str__(self):
        return (
            f"Transfer {self.product.sku}: "
            f"{self.from_warehouse.code} → {self.to_warehouse.code} ({self.status})"
        )
