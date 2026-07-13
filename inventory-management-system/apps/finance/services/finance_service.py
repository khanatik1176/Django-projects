from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.finance.models import (
    Expense,
    Payment,
    PaymentDirection,
    PaymentMethod,
    PaymentType,
)
from apps.finance.services.activity_service import ActivityService
from apps.orders.models import Customer


class FinanceService:

    @staticmethod
    @transaction.atomic
    def record_sale_income(
        *,
        amount,
        payment_method,
        sales_order_id,
        user,
        description="",
        customer_id=None,
    ):
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValidationError({"amount": "Amount must be positive."})

        payment_type = (
            PaymentType.CREDIT_SALE
            if payment_method == PaymentMethod.CREDIT
            else PaymentType.SALE_INCOME
        )

        payment = Payment.objects.create(
            payment_type=payment_type,
            direction=PaymentDirection.IN,
            payment_method=payment_method,
            amount=amount,
            description=description or f"Sale income via {payment_method}",
            reference_type="sales_order",
            reference_id=sales_order_id,
            sales_order_id=sales_order_id,
            customer_id=customer_id,
            created_by=user,
        )

        ActivityService.log(
            action="PAYMENT_RECORDED",
            module="finance",
            entity_type="Payment",
            entity_id=payment.id,
            entity_label=description or payment.payment_type,
            description=f"Recorded {payment_method} income of {amount}",
            user=user,
            metadata={"sales_order_id": sales_order_id, "amount": str(amount)},
        )
        return payment

    @staticmethod
    @transaction.atomic
    def record_credit_collection(
        *,
        amount,
        customer_id,
        user,
        payment_method=PaymentMethod.CASH,
        notes="",
    ):
        amount = Decimal(str(amount))
        payment = Payment.objects.create(
            payment_type=PaymentType.CREDIT_COLLECTION,
            direction=PaymentDirection.IN,
            payment_method=payment_method,
            amount=amount,
            description=notes or "Udhar collection",
            reference_type="customer",
            reference_id=customer_id,
            customer_id=customer_id,
            created_by=user,
        )

        ActivityService.log(
            action="CREDIT_COLLECTION",
            module="finance",
            entity_type="Customer",
            entity_id=customer_id,
            description=f"Collected {amount} udhar via {payment_method}",
            user=user,
            metadata={"amount": str(amount)},
        )
        return payment

    @staticmethod
    @transaction.atomic
    def record_expense(*, expense: Expense, user):
        payment = Payment.objects.create(
            payment_type=PaymentType.EXPENSE,
            direction=PaymentDirection.OUT,
            payment_method=expense.payment_method,
            amount=expense.amount,
            description=expense.description,
            reference_type="expense",
            reference_id=expense.id,
            created_by=user,
        )

        ActivityService.log(
            action="EXPENSE_RECORDED",
            module="finance",
            entity_type="Expense",
            entity_id=expense.id,
            entity_label=expense.description,
            description=f"Expense {expense.category}: {expense.amount}",
            user=user,
            metadata={"category": expense.category, "amount": str(expense.amount)},
        )
        return payment

    @staticmethod
    def get_summary():
        today = timezone.localdate()
        month_start = today.replace(day=1)

        payments_in = Payment.objects.filter(direction=PaymentDirection.IN)
        payments_out = Payment.objects.filter(direction=PaymentDirection.OUT)

        today_revenue = payments_in.filter(created_at__date=today).aggregate(
            total=Coalesce(Sum("amount"), Decimal("0"))
        )["total"]
        month_revenue = payments_in.filter(created_at__date__gte=month_start).aggregate(
            total=Coalesce(Sum("amount"), Decimal("0"))
        )["total"]
        today_expenses = payments_out.filter(created_at__date=today).aggregate(
            total=Coalesce(Sum("amount"), Decimal("0"))
        )["total"]
        month_expenses = payments_out.filter(created_at__date__gte=month_start).aggregate(
            total=Coalesce(Sum("amount"), Decimal("0"))
        )["total"]

        udhar_outstanding = Customer.objects.filter(is_active=True).aggregate(
            total=Coalesce(Sum("credit_balance"), Decimal("0"))
        )["total"]

        by_method = (
            payments_in.filter(created_at__date__gte=month_start)
            .values("payment_method")
            .annotate(total=Coalesce(Sum("amount"), Decimal("0")))
            .order_by("-total")
        )

        week_ago = today - timedelta(days=6)
        daily_revenue = []
        for offset in range(7):
            day = week_ago + timedelta(days=offset)
            total = payments_in.filter(created_at__date=day).aggregate(
                total=Coalesce(Sum("amount"), Decimal("0"))
            )["total"]
            daily_revenue.append({"date": day.isoformat(), "revenue": total})

        recent_payments = list(
            Payment.objects.select_related("customer", "created_by")
            .order_by("-created_at")[:15]
            .values(
                "id",
                "payment_type",
                "direction",
                "payment_method",
                "amount",
                "description",
                "created_at",
                "customer_id",
            )
        )

        return {
            "today_revenue": today_revenue,
            "month_revenue": month_revenue,
            "today_expenses": today_expenses,
            "month_expenses": month_expenses,
            "month_net": month_revenue - month_expenses,
            "udhar_outstanding": udhar_outstanding,
            "payment_method_breakdown": list(by_method),
            "daily_revenue": daily_revenue,
            "recent_payments": recent_payments,
        }
