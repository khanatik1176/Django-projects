from rest_framework.permissions import IsAuthenticated

from core.views.base import BaseModelViewSet

from apps.products.models import Brand
from apps.products.serializers.brand import BrandSerializer

class BrandViewSet(BaseModelViewSet):
    
    queryset = Brand.objects.all()
    
    serializer_class = BrandSerializer
    
    permission_classes = [IsAuthenticated]
    
    search_fields = ["name"]
    
    filter_fields = ["is_active"]
    
    ordering_fields = ["created_at", "updated_at"]
    
    