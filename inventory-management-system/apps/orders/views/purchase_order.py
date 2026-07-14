from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.views.base import BaseModelViewSet

from apps.orders.models import PurchaseOrder, PurchaseOrderItem
from apps.orders.serializers.purchase_order import (
    PurchaseOrderCreateSerializer,
    PurchaseOrderReceiveSerializer,
    PurchaseOrderSerializer,
)
from apps.orders.services import PurchaseOrderService


@extend_schema(tags=["Purchase Orders"])
class PurchaseOrderViewSet(BaseModelViewSet):

    queryset = PurchaseOrder.objects.select_related("supplier", "warehouse").prefetch_related(
        "items__product"
    )
    permission_classes = [IsAuthenticated]
    search_fields = ["po_number", "supplier__name", "notes"]
    filterset_fields = ["status", "supplier", "warehouse"]
    ordering_fields = ["order_date", "created_at", "status"]
    http_method_names = ["get", "post", "head", "options"]

    def get_serializer_class(self):
        if self.action == "create":
            return PurchaseOrderCreateSerializer
        return PurchaseOrderSerializer

    @extend_schema(summary="Submit purchase order")
    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        po = PurchaseOrderService.submit(purchase_order_id=pk, user=request.user)
        return ApiResponse.success(
            message="Purchase order submitted.",
            data=PurchaseOrderSerializer(po).data,
        )

    @extend_schema(summary="Cancel purchase order")
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        po = PurchaseOrderService.cancel(purchase_order_id=pk, user=request.user)
        return ApiResponse.success(
            message="Purchase order cancelled.",
            data=PurchaseOrderSerializer(po).data,
        )

    @extend_schema(
        summary="Receive stock for a PO line item",
        request=PurchaseOrderReceiveSerializer,
    )
    @action(
        detail=True,
        methods=["post"],
        url_path=r"items/(?P<item_id>[^/.]+)/receive",
    )
    def receive_item(self, request, pk=None, item_id=None):
        serializer = PurchaseOrderReceiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = PurchaseOrderItem.objects.get(pk=item_id, purchase_order_id=pk)
        item = PurchaseOrderService.receive_item(
            item_id=item.id,
            quantity=serializer.validated_data["quantity"],
            user=request.user,
            expiry_date=serializer.validated_data.get("expiry_date"),
            batch_number=serializer.validated_data.get("batch_number") or "",
        )

        po = PurchaseOrder.objects.prefetch_related("items__product").get(pk=pk)
        return ApiResponse.success(
            message="Stock received successfully.",
            data=PurchaseOrderSerializer(po).data,
        )
