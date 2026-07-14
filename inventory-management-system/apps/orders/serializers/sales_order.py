from rest_framework import serializers

from apps.orders.models import SalesOrder, SalesOrderItem


class SalesOrderItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    quantity_remaining = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    line_total = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = SalesOrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "quantity_ordered",
            "quantity_fulfilled",
            "quantity_reserved",
            "quantity_remaining",
            "unit_price",
            "line_total",
        ]
        read_only_fields = ["id", "quantity_fulfilled", "quantity_reserved"]


class SalesOrderItemCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = SalesOrderItem
        fields = ["product", "quantity_ordered", "unit_price"]


class SalesOrderSerializer(serializers.ModelSerializer):

    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    items = SalesOrderItemSerializer(many=True, read_only=True)
    total_ordered = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    total_fulfilled = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    total_revenue = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    is_pos = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    invoice_number = serializers.CharField(source="so_number", read_only=True)

    class Meta:
        model = SalesOrder
        fields = [
            "id",
            "so_number",
            "invoice_number",
            "customer_name",
            "customer_email",
            "customer_phone",
            "warehouse",
            "warehouse_name",
            "status",
            "order_date",
            "notes",
            "items",
            "total_ordered",
            "total_fulfilled",
            "total_revenue",
            "is_pos",
            "payment_method",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "so_number", "status", "created_at", "updated_at"]

    def get_is_pos(self, obj):
        return bool(obj.notes and obj.notes.startswith("POS ·"))

    def get_payment_method(self, obj):
        if not obj.notes or not obj.notes.startswith("POS ·"):
            return None
        parts = obj.notes.split(" · ")
        return parts[1] if len(parts) > 1 else None


class SalesOrderCreateSerializer(serializers.ModelSerializer):

    items = SalesOrderItemCreateSerializer(many=True)

    class Meta:
        model = SalesOrder
        fields = [
            "customer_name",
            "customer_email",
            "customer_phone",
            "warehouse",
            "order_date",
            "notes",
            "items",
        ]

    def create(self, validated_data):
        from apps.orders.services import SalesOrderService

        items_data = validated_data.pop("items")
        user = validated_data.pop("created_by", None) or self.context["request"].user
        validated_data.pop("updated_by", None)

        sales_order = SalesOrder.objects.create(
            so_number=SalesOrderService._generate_so_number(),
            created_by=user,
            updated_by=user,
            **validated_data,
        )

        for item_data in items_data:
            SalesOrderItem.objects.create(
                sales_order=sales_order,
                created_by=user,
                updated_by=user,
                **item_data,
            )

        return sales_order


class SalesOrderFulfillSerializer(serializers.Serializer):

    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
