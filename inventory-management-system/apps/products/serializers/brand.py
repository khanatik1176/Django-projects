from rest_framework import serializers
from apps.products.models import Brand

class BrandSerializer(serializers.ModelSerializer):
    
    class Meta:
        
        model = Brand
        
        fields = "__all__"
        
        read_only_fields = ["id", "created_at","updated_at","created_by","updated_by", "deleted_at", "is_deleted"]
        