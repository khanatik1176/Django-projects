from decimal import Decimal

from django.conf import settings
from django.db import models


class PaymentMethod(models.TextChoices):
    CASH = "CASH", "Cash"
    BKASH = "BKASH", "bKash"
    NAGAD = "NAGAD", "Nagad"
    BANK = "BANK", "Bank"
    CREDIT = "CREDIT", "Udhar / Credit"


class PaymentType(models.TextChoices):
    SALE_INCOME = "SALE_INCOME", "Sale income"
    CREDIT_SALE = "CREDIT_SALE", "Credit sale (udhar)"
    CREDIT_COLLECTION = "CREDIT_COLLECTION", "Udhar collection"
    PURCHASE_PAYMENT = "PURCHASE_PAYMENT", "Supplier payment"
    EXPENSE = "EXPENSE", "Expense"
    ADJUSTMENT = "ADJUSTMENT", "Adjustment"


class PaymentDirection(models.TextChoices):
    IN = "IN", "Money in"
    OUT = "OUT", "Money out"


class Payment(models.Model):
    """Cash book entry — every taka in or out of the shop."""

    payment_type = models.CharField(max_length=30, choices=PaymentType.choices)
    direction = models.CharField(max_length=3, choices=PaymentDirection.choices)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    reference_type = models.CharField(max_length=40, blank=True)
    reference_id = models.PositiveIntegerField(null=True, blank=True)
    sales_order = models.ForeignKey(
        "orders.SalesOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    customer = models.ForeignKey(
        "orders.Customer",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="finance_payments",
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "finance_payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.payment_type} {self.direction} {self.amount}"
