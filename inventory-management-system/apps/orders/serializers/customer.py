from rest_framework import serializers

from apps.orders.models import CreditTransaction, Customer


class CustomerSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "address",
            "credit_balance",
            "credit_limit",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "credit_balance", "created_at", "updated_at"]


class CreditTransactionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = CreditTransaction
        fields = [
            "id",
            "customer",
            "customer_name",
            "transaction_type",
            "amount",
            "balance_after",
            "sales_order",
            "notes",
            "created_at",
        ]
        read_only_fields = fields


class CreditPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    payment_method = serializers.ChoiceField(
        choices=["CASH", "BKASH", "NAGAD", "BANK"],
        required=False,
        default="CASH",
    )
