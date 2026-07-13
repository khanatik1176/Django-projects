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
            "unit_of_measure",
            "cost_price",
            "selling_price",
            "category",
            "brand",
            "is_perishable",
            "shelf_life_days",
            "is_active",
        ]