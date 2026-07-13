from decimal import Decimal

from django.db import models
from django.utils import timezone

from core.models.audit import AuditModel

from apps.products.models import Product

from .stock import Stock
from .warehouse import Warehouse


class StockBatch(AuditModel):
    """Batch/lot tracking for perishable grocery items with expiry dates."""

    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name="batches",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name="stock_batches",
    )
    warehouse = models.ForeignKey(
        Warehouse,
        on_delete=models.PROTECT,
        related_name="stock_batches",
    )
    batch_number = models.CharField(max_length=80, blank=True, default="")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    expiry_date = models.DateField(null=True, blank=True)
    received_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "inventory_stock_batch"
        ordering = ["expiry_date", "received_at"]
        verbose_name = "Stock Batch"
        verbose_name_plural = "Stock Batches"

    def __str__(self):
        expiry = self.expiry_date or "no expiry"
        return f"{self.product.sku} batch {self.batch_number or self.id} ({expiry})"
