from rest_framework import serializers

from apps.products.models import (
    Product,
    Category,
    Brand,
    Supplier,
)


class ProductCreateSerializer(serializers.ModelSerializer):

    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
    )

    brand_id = serializers.PrimaryKeyRelatedField(
        queryset=Brand.objects.all(),
        source="brand",
    )

    supplier_id = serializers.PrimaryKeyRelatedField(
        queryset=Supplier.objects.all(),
        source="supplier",
    )

    class Meta:
        model = Product

        fields = [
            "name",
            "sku",
            "barcode",
            "description",
            "is_active",
            "category_id",
            "brand_id",
            "supplier_id",
        ]