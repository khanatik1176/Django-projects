from rest_framework import serializers

from apps.finance.models import ActivityLog, Expense, Payment


class PaymentSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True, default="")

    class Meta:
        model = Payment
        fields = [
            "id",
            "payment_type",
            "direction",
            "payment_method",
            "amount",
            "description",
            "reference_type",
            "reference_id",
            "sales_order_id",
            "customer_id",
            "customer_name",
            "created_by_email",
            "created_at",
        ]


class ExpenseSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source="created_by.email", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "category",
            "amount",
            "description",
            "expense_date",
            "payment_method",
            "notes",
            "created_by_email",
            "created_at",
        ]
        read_only_fields = ["created_at"]


class ExpenseCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Expense
        fields = [
            "category",
            "amount",
            "description",
            "expense_date",
            "payment_method",
            "notes",
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    user_display = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "action",
            "module",
            "entity_type",
            "entity_id",
            "entity_label",
            "description",
            "metadata",
            "user_display",
            "user_email",
            "created_at",
        ]

    def get_user_display(self, obj):
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name or obj.user.email
        return obj.user_email or "System"
