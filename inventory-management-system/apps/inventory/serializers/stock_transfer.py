from rest_framework import serializers

from apps.inventory.models import StockTransfer


class StockTransferSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    from_warehouse_name = serializers.CharField(
        source="from_warehouse.name",
        read_only=True,
    )
    to_warehouse_name = serializers.CharField(
        source="to_warehouse.name",
        read_only=True,
    )

    class Meta:
        model = StockTransfer
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "from_warehouse",
            "from_warehouse_name",
            "to_warehouse",
            "to_warehouse_name",
            "quantity",
            "status",
            "reference_number",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]

    def validate(self, attrs):
        from_warehouse = attrs.get("from_warehouse") or (
            self.instance.from_warehouse if self.instance else None
        )
        to_warehouse = attrs.get("to_warehouse") or (
            self.instance.to_warehouse if self.instance else None
        )

        if from_warehouse and to_warehouse and from_warehouse.pk == to_warehouse.pk:
            raise serializers.ValidationError(
                {"to_warehouse": "Source and destination warehouse must differ."}
            )

        return attrs
