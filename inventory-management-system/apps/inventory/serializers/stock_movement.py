from rest_framework import serializers

from apps.inventory.models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    warehouse_code = serializers.CharField(source="warehouse.code", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "warehouse",
            "warehouse_name",
            "warehouse_code",
            "movement_type",
            "quantity",
            "quantity_before",
            "quantity_after",
            "reference_number",
            "notes",
            "stock_transfer",
            "created_at",
            "created_by",
        ]
        read_only_fields = fields
