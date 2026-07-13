from rest_framework.permissions import IsAuthenticated

from core.views.base import BaseModelViewSet

from apps.inventory.models import Warehouse
from apps.inventory.serializers.warehouse import WarehouseSerializer


class WarehouseViewSet(BaseModelViewSet):

    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "code", "address"]
    filterset_fields = ["is_active", "is_default"]
    ordering_fields = ["name", "created_at"]
