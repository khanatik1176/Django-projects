from rest_framework.permissions import IsAuthenticated

from core.views.base import BaseModelViewSet

from apps.products.models import Category
from apps.products.serializers.category import CategorySerializer

class CategoryViewSet(BaseModelViewSet):
    
    queryset = Category.objects.all()
    
    serializer_class = CategorySerializer
    
    permission_classes = [IsAuthenticated]
    
    search_fields = ["name", "description"]
    
    filterset_fields = ["is_active"]
    
    ordering_fields = ["created_at", "updated_at"]
    
    