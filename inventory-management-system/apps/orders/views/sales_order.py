from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.views.base import BaseModelViewSet

from apps.orders.models import SalesOrder, SalesOrderItem
from apps.orders.serializers.sales_order import (
    SalesOrderCreateSerializer,
    SalesOrderFulfillSerializer,
    SalesOrderSerializer,
)
from apps.orders.services import SalesOrderService


@extend_schema(tags=["Sales Orders"])
class SalesOrderViewSet(BaseModelViewSet):

    queryset = SalesOrder.objects.select_related("warehouse").prefetch_related(
        "items__product"
    )
    permission_classes = [IsAuthenticated]
    search_fields = ["so_number", "customer_name", "customer_email", "notes"]
    filterset_fields = ["status", "warehouse"]
    ordering_fields = ["order_date", "created_at", "status"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        queryset = super().get_queryset()
        source = self.request.query_params.get("source")
        if source == "pos":
            queryset = queryset.filter(notes__startswith="POS ·")
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return SalesOrderCreateSerializer
        return SalesOrderSerializer

    @extend_schema(summary="Confirm sales order and reserve stock")
    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        so = SalesOrderService.confirm(sales_order_id=pk, user=request.user)
        return ApiResponse.success(
            message="Sales order confirmed and stock reserved.",
            data=SalesOrderSerializer(so).data,
        )

    @extend_schema(summary="Cancel sales order and release reservations")
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        so = SalesOrderService.cancel(sales_order_id=pk, user=request.user)
        return ApiResponse.success(
            message="Sales order cancelled.",
            data=SalesOrderSerializer(so).data,
        )

    @extend_schema(
        summary="Fulfill a sales order line item",
        request=SalesOrderFulfillSerializer,
    )
    @action(
        detail=True,
        methods=["post"],
        url_path=r"items/(?P<item_id>[^/.]+)/fulfill",
    )
    def fulfill_item(self, request, pk=None, item_id=None):
        serializer = SalesOrderFulfillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        item = SalesOrderItem.objects.get(pk=item_id, sales_order_id=pk)
        SalesOrderService.fulfill_item(
            item_id=item.id,
            quantity=serializer.validated_data["quantity"],
            user=request.user,
        )

        so = SalesOrder.objects.prefetch_related("items__product").get(pk=pk)
        return ApiResponse.success(
            message="Sales order item fulfilled.",
            data=SalesOrderSerializer(so).data,
        )
