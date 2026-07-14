from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.finance.services import ActivityService
from apps.orders.models import CreditTransaction, CreditTransactionType, Customer


class CreditService:

    @staticmethod
    @transaction.atomic
    def record_sale(*, customer_id, amount, sales_order_id, user, notes=""):
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValidationError({"amount": "Amount must be positive."})

        customer = Customer.objects.select_for_update().get(pk=customer_id)
        new_balance = customer.credit_balance + amount

        if customer.effective_credit_limit > 0 and new_balance > customer.effective_credit_limit:
            raise ValidationError(
                {
                    "credit_limit": (
                        f"Credit limit exceeded. Limit: {customer.effective_credit_limit}, "
                        f"would become: {new_balance}."
                    )
                }
            )

        customer.credit_balance = new_balance
        customer.save(update_fields=["credit_balance", "updated_at"])

        txn = CreditTransaction.objects.create(
            customer=customer,
            transaction_type=CreditTransactionType.SALE,
            amount=amount,
            balance_after=new_balance,
            sales_order_id=sales_order_id,
            notes=notes or "POS credit sale",
            created_by=user,
        )

        ActivityService.log(
            action="CREDIT_SALE",
            module="orders",
            entity_type="Customer",
            entity_id=customer.id,
            entity_label=customer.name,
            description=f"Udhar sale {amount} — balance now {new_balance}",
            user=user,
            metadata={"amount": str(amount), "sales_order_id": sales_order_id},
        )
        return txn

    @staticmethod
    @transaction.atomic
    def record_payment(*, customer_id, amount, user, notes=""):
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValidationError({"amount": "Amount must be positive."})

        customer = Customer.objects.select_for_update().get(pk=customer_id)
        if customer.credit_balance < amount:
            raise ValidationError(
                {"amount": f"Payment exceeds outstanding balance ({customer.credit_balance})."}
            )

        new_balance = customer.credit_balance - amount
        customer.credit_balance = new_balance
        customer.save(update_fields=["credit_balance", "updated_at"])

        txn = CreditTransaction.objects.create(
            customer=customer,
            transaction_type=CreditTransactionType.PAYMENT,
            amount=amount,
            balance_after=new_balance,
            notes=notes or "Udhar collection",
            created_by=user,
        )

        ActivityService.log(
            action="CREDIT_PAYMENT",
            module="orders",
            entity_type="Customer",
            entity_id=customer.id,
            entity_label=customer.name,
            description=f"Collected {amount} udhar — balance now {new_balance}",
            user=user,
            metadata={"amount": str(amount)},
        )
        return txn
