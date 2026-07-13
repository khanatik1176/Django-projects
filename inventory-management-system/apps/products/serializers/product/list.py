from rest_framework import serializers

from apps.products.models import Product


class ProductListSerializer(serializers.ModelSerializer):

    category = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    brand = serializers.CharField(
        source="brand.name",
        read_only=True,
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "sku",
            "category",
            "brand",
            "is_active",
        ]