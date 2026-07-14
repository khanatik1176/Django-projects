from apps.orders.models import (
    Customer,
    CreditTransaction,
    LoyaltyOffer,
    MembershipTier,
    PointsLedger,
)
from rest_framework import serializers


class MembershipTierSerializer(serializers.ModelSerializer):
    customer_count = serializers.SerializerMethodField()

    class Meta:
        model = MembershipTier
        fields = [
            "id",
            "name",
            "code",
            "description",
            "discount_percent",
            "points_per_hundred",
            "min_points",
            "credit_limit_bonus",
            "color",
            "sort_order",
            "is_system",
            "is_active",
            "benefits",
            "customer_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_system", "created_at", "updated_at", "customer_count"]

    def get_customer_count(self, obj):
        return obj.customers.count()


class LoyaltyOfferSerializer(serializers.ModelSerializer):
    membership_name = serializers.CharField(source="membership.name", read_only=True)

    class Meta:
        model = LoyaltyOffer
        fields = [
            "id",
            "title",
            "description",
            "offer_type",
            "value",
            "points_cost",
            "membership",
            "membership_name",
            "min_points_balance",
            "is_active",
            "starts_at",
            "ends_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "membership_name"]


class PointsLedgerSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    offer_title = serializers.CharField(source="offer.title", read_only=True)

    class Meta:
        model = PointsLedger
        fields = [
            "id",
            "customer",
            "customer_name",
            "entry_type",
            "points",
            "balance_after",
            "sales_order",
            "offer",
            "offer_title",
            "notes",
            "created_at",
        ]
        read_only_fields = fields


class CustomerSerializer(serializers.ModelSerializer):
    membership_name = serializers.CharField(source="membership.name", read_only=True)
    membership_code = serializers.CharField(source="membership.code", read_only=True)
    membership_color = serializers.CharField(source="membership.color", read_only=True)
    membership_discount_percent = serializers.DecimalField(
        source="membership.discount_percent",
        max_digits=5,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    membership_points_per_hundred = serializers.DecimalField(
        source="membership.points_per_hundred",
        max_digits=8,
        decimal_places=2,
        read_only=True,
        allow_null=True,
    )
    effective_credit_limit = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "address",
            "credit_balance",
            "credit_limit",
            "effective_credit_limit",
            "membership",
            "membership_name",
            "membership_code",
            "membership_color",
            "membership_discount_percent",
            "membership_points_per_hundred",
            "loyalty_points",
            "lifetime_points",
            "membership_joined_at",
            "is_active",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "credit_balance",
            "loyalty_points",
            "lifetime_points",
            "membership_joined_at",
            "created_at",
            "updated_at",
            "effective_credit_limit",
            "membership_name",
            "membership_code",
            "membership_color",
            "membership_discount_percent",
            "membership_points_per_hundred",
        ]


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


class AssignMembershipSerializer(serializers.Serializer):
    membership_id = serializers.IntegerField(required=False, allow_null=True)


class AdjustPointsSerializer(serializers.Serializer):
    points = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True, default="")
