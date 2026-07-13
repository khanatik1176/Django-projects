from decimal import Decimal

from django.conf import settings
from django.db import models


class Customer(models.Model):
    """Neighborhood customer for udhar (credit) tracking — common in BD grocery shops."""

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, blank=True, db_index=True)
    address = models.TextField(blank=True)
    credit_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Amount the customer currently owes the shop.",
    )
    credit_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("5000"),
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customers"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.phone or 'no phone'})"


class CreditTransactionType(models.TextChoices):
    SALE = "SALE", "Credit sale"
    PAYMENT = "PAYMENT", "Payment received"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"


class CreditTransaction(models.Model):
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    transaction_type = models.CharField(max_length=20, choices=CreditTransactionType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    sales_order = models.ForeignKey(
        "orders.SalesOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="credit_transactions",
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "credit_transactions"
        ordering = ["-created_at"]
