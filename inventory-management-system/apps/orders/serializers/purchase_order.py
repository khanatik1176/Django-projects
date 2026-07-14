from rest_framework import serializers

from apps.orders.models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    is_perishable = serializers.BooleanField(source="product.is_perishable", read_only=True)
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
        model = PurchaseOrderItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "is_perishable",
            "quantity_ordered",
            "quantity_received",
            "quantity_remaining",
            "unit_cost",
            "line_total",
        ]
        read_only_fields = ["id", "quantity_received"]


class PurchaseOrderItemCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = PurchaseOrderItem
        fields = ["product", "quantity_ordered", "unit_cost"]


class PurchaseOrderSerializer(serializers.ModelSerializer):

    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    total_ordered = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    total_received = serializers.DecimalField(
        max_digits=14, decimal_places=2, read_only=True
    )
    total_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "po_number",
            "supplier",
            "supplier_name",
            "warehouse",
            "warehouse_name",
            "status",
            "order_date",
            "expected_date",
            "notes",
            "items",
            "total_ordered",
            "total_received",
            "total_cost",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "po_number", "status", "created_at", "updated_at"]


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):

    items = PurchaseOrderItemCreateSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            "supplier",
            "warehouse",
            "order_date",
            "expected_date",
            "notes",
            "items",
        ]

    def create(self, validated_data):
        from apps.orders.services import PurchaseOrderService

        items_data = validated_data.pop("items")
        user = validated_data.pop("created_by", None) or self.context["request"].user
        validated_data.pop("updated_by", None)

        purchase_order = PurchaseOrder.objects.create(
            po_number=PurchaseOrderService._generate_po_number(),
            created_by=user,
            updated_by=user,
            **validated_data,
        )

        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=purchase_order,
                created_by=user,
                updated_by=user,
                **item_data,
            )

        return purchase_order


class PurchaseOrderReceiveSerializer(serializers.Serializer):

    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    batch_number = serializers.CharField(required=False, allow_blank=True, max_length=100)
