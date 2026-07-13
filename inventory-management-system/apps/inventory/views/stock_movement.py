from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ReadOnlyModelViewSet

from drf_spectacular.utils import extend_schema

from apps.inventory.models import StockMovement
from apps.inventory.serializers.stock_movement import StockMovementSerializer


@extend_schema(tags=["Inventory - Movements"])
class StockMovementViewSet(ReadOnlyModelViewSet):

    queryset = StockMovement.objects.select_related(
        "product",
        "warehouse",
        "created_by",
    )
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["product__name", "product__sku", "reference_number", "notes"]
    filterset_fields = ["movement_type", "warehouse", "product"]
    ordering_fields = ["created_at", "quantity"]
