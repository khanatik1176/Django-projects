from rest_framework import serializers

from apps.inventory.models import Stock
from apps.inventory.services.stock_health import compute_stock_health


class StockHealthMixin(serializers.Serializer):
    health_status = serializers.SerializerMethodField()
    health_label = serializers.SerializerMethodField()
    is_expiring_soon = serializers.SerializerMethodField()
    days_to_expiry = serializers.SerializerMethodField()
    expiring_quantity = serializers.SerializerMethodField()
    is_perishable = serializers.BooleanField(source="product.is_perishable", read_only=True)

    def _health_data(self, obj):
        cached = getattr(obj, "_health_data", None)
        if cached is not None:
            return cached
        batches = getattr(obj, "_health_batches", None)
        if batches is None and hasattr(obj, "batches"):
            batches = list(obj.batches.filter(quantity__gt=0))
        data = compute_stock_health(obj, batches)
        obj._health_data = data
        return data

    def get_health_status(self, obj):
        return self._health_data(obj)["health_status"]

    def get_health_label(self, obj):
        return self._health_data(obj)["health_label"]

    def get_is_expiring_soon(self, obj):
        return self._health_data(obj)["is_expiring_soon"]

    def get_days_to_expiry(self, obj):
        return self._health_data(obj)["days_to_expiry"]

    def get_expiring_quantity(self, obj):
        return self._health_data(obj)["expiring_quantity"]


class StockListSerializer(StockHealthMixin, serializers.ModelSerializer):

    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    warehouse_code = serializers.CharField(source="warehouse.code", read_only=True)
    available_quantity = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Stock
        fields = [
            "id",
            "product",
            "product_name",
            "product_sku",
            "warehouse",
            "warehouse_name",
            "warehouse_code",
            "quantity",
            "reserved_quantity",
            "available_quantity",
            "reorder_level",
            "max_stock_level",
            "is_low_stock",
            "is_perishable",
            "health_status",
            "health_label",
            "is_expiring_soon",
            "days_to_expiry",
            "expiring_quantity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "quantity",
            "reserved_quantity",
            "created_at",
            "updated_at",
        ]


class StockDetailSerializer(StockListSerializer):

    unit_of_measure = serializers.CharField(
        source="product.unit_of_measure",
        read_only=True,
    )
    batches = serializers.SerializerMethodField()

    class Meta(StockListSerializer.Meta):
        fields = StockListSerializer.Meta.fields + ["unit_of_measure", "batches"]

    def get_batches(self, obj):
        from apps.inventory.serializers.stock_batch import StockBatchSerializer

        batches = getattr(obj, "_health_batches", None)
        if batches is None:
            batches = obj.batches.filter(quantity__gt=0).order_by("expiry_date", "received_at")
        return StockBatchSerializer(batches, many=True).data


class StockThresholdUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Stock
        fields = ["reorder_level", "max_stock_level"]
