from rest_framework import serializers


class StockReceiveSerializer(serializers.Serializer):

    product_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    reference_number = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    expiry_date = serializers.DateField(required=False, allow_null=True)
    batch_number = serializers.CharField(required=False, allow_blank=True, default="")


class StockIssueSerializer(serializers.Serializer):

    product_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    reference_number = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class StockAdjustSerializer(serializers.Serializer):

    product_id = serializers.IntegerField()
    warehouse_id = serializers.IntegerField()
    new_quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class StockManageSerializer(serializers.Serializer):
    """Admin/manager stock update actions from the stock list."""

    ACTION_UPDATE_THRESHOLDS = "update_thresholds"
    ACTION_ADJUST_QUANTITY = "adjust_quantity"
    ACTION_WRITE_OFF_EXPIRED = "write_off_expired"
    ACTION_TOP_UP = "top_up"

    action = serializers.ChoiceField(
        choices=[
            ACTION_UPDATE_THRESHOLDS,
            ACTION_ADJUST_QUANTITY,
            ACTION_WRITE_OFF_EXPIRED,
            ACTION_TOP_UP,
        ]
    )
    reorder_level = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    max_stock_level = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    new_quantity = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    expiry_date = serializers.DateField(required=False, allow_null=True)
    batch_number = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    include_expiring_soon = serializers.BooleanField(required=False, default=False)
