from rest_framework import serializers

from apps.inventory.models import StockBatch


class StockBatchSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    days_left = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = StockBatch
        fields = [
            "id",
            "batch_number",
            "quantity",
            "expiry_date",
            "received_at",
            "product_name",
            "days_left",
            "is_expired",
        ]

    def get_days_left(self, obj):
        if not obj.expiry_date:
            return None
        from django.utils import timezone

        return (obj.expiry_date - timezone.now().date()).days

    def get_is_expired(self, obj):
        if not obj.expiry_date:
            return False
        from django.utils import timezone

        return obj.expiry_date < timezone.now().date()
