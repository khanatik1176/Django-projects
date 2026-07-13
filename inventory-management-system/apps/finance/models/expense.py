from decimal import Decimal

from django.conf import settings
from django.db import models

from .payment import PaymentMethod


class ExpenseCategory(models.TextChoices):
    RENT = "RENT", "Shop rent"
    UTILITIES = "UTILITIES", "Utilities"
    SALARY = "SALARY", "Salary / wages"
    TRANSPORT = "TRANSPORT", "Transport"
    SUPPLIES = "SUPPLIES", "Shop supplies"
    MAINTENANCE = "MAINTENANCE", "Maintenance"
    OTHER = "OTHER", "Other"


class Expense(models.Model):
    category = models.CharField(max_length=20, choices=ExpenseCategory.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255)
    expense_date = models.DateField()
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.CASH,
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "finance_expenses"
        ordering = ["-expense_date", "-created_at"]

    def __str__(self):
        return f"{self.category} — {self.amount}"
