from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.views.base import BaseModelViewSet

from apps.inventory.models import StockTransfer
from apps.inventory.serializers.stock_transfer import StockTransferSerializer
from apps.inventory.services import InventoryService


@extend_schema(tags=["Inventory - Transfers"])
class StockTransferViewSet(BaseModelViewSet):

    queryset = StockTransfer.objects.select_related(
        "product",
        "from_warehouse",
        "to_warehouse",
    )
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["product__name", "product__sku", "reference_number"]
    filterset_fields = ["status", "from_warehouse", "to_warehouse", "product"]
    ordering_fields = ["created_at", "status"]
    http_method_names = ["get", "post", "head", "options"]

    @extend_schema(
        summary="Complete transfer",
        description="Execute a pending transfer and update stock at both warehouses.",
    )
    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        transfer = InventoryService.complete_transfer(
            transfer_id=pk,
            user=request.user,
        )
        return ApiResponse.success(
            message="Transfer completed successfully.",
            data=StockTransferSerializer(transfer).data,
        )

    @extend_schema(
        summary="Cancel transfer",
        description="Cancel a pending transfer without moving stock.",
    )
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        transfer = InventoryService.cancel_transfer(
            transfer_id=pk,
            user=request.user,
        )
        return ApiResponse.success(
            message="Transfer cancelled successfully.",
            data=StockTransferSerializer(transfer).data,
        )
