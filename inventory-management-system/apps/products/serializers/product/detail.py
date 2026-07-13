from rest_framework import serializers

from apps.products.models import Product

from apps.products.serializers.category import CategorySerializer
from apps.products.serializers.brand import BrandSerializer
from apps.products.serializers.supplier import SupplierSerializer


class ProductDetailSerializer(serializers.ModelSerializer):

    category = CategorySerializer()

    brand = BrandSerializer()

    supplier = SupplierSerializer()

    class Meta:
        model = Product

        fields = "__all__"