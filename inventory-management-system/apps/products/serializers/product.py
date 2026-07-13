from rest_framework import serializers
from apps.products.models import (Product, Category, Brand, Supplier)
from apps.products.serializers.category import CategorySerializer
from apps.products.serializers.brand import BrandSerializer
from apps.products.serializers.supplier import SupplierSerializer

class ProductSerializer(serializers.ModelSerializer):
    
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)
    supplier = SupplierSerializer(read_only=True)
    
    category_id = serializers.PrimaryKeyRelatedField(source="category", queryset=Category.objects.all(), write_only=True)
    brand_id = serializers.PrimaryKeyRelatedField(source="brand", queryset=Brand.objects.all(), write_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField(source="supplier", queryset=Supplier.objects.all(), write_only=True)
    
    class Meta:
        
        model = Product
        
        fields = [
            "id",
            "name",
            "sku",
            "barcode",
            "category",
            "brand",
            "supplier",
            "category_id",
            "brand_id",
            "supplier_id",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]                