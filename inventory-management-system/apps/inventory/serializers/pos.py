from rest_framework import serializers


class POSCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    unit_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False
    )


class POSCheckoutSerializer(serializers.Serializer):
    PAYMENT_CASH = "CASH"
    PAYMENT_BKASH = "BKASH"
    PAYMENT_NAGAD = "NAGAD"
    PAYMENT_CREDIT = "CREDIT"

    warehouse_id = serializers.IntegerField()
    items = POSCartItemSerializer(many=True)
    customer_name = serializers.CharField(required=False, default="Walk-in Customer")
    customer_phone = serializers.CharField(required=False, allow_blank=True, default="")
    payment_method = serializers.ChoiceField(
        choices=[PAYMENT_CASH, PAYMENT_BKASH, PAYMENT_NAGAD, PAYMENT_CREDIT],
        default=PAYMENT_CASH,
    )
    customer_id = serializers.IntegerField(required=False, allow_null=True)
    redeem_offer_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
