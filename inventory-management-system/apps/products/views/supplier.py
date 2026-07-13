from rest_framework.permissions import IsAuthenticated

from core.views.base import BaseModelViewSet

from apps.products.models import Supplier
from apps.products.serializers.supplier import SupplierSerializer

class SupplierViewSet(BaseModelViewSet):
    
    queryset = Supplier.objects.all()
    
    serializer_class = SupplierSerializer
    
    permission_classes = [IsAuthenticated]
    
    search_fields = ["name", "email", "phone"]
    
    filterset_fields = ["is_active"]
    
    ordering_fields = ["created_at", "updated_at"]
    
    