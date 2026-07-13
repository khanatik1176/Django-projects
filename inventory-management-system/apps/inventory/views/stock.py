from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from django.utils import timezone

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.views.base import BaseModelViewSet

from apps.accounts.permissions import CanManageInventory, CanUpdateStockList
from apps.inventory.models import Stock
from apps.inventory.serializers.stock import (
    StockDetailSerializer,
    StockListSerializer,
    StockThresholdUpdateSerializer,
)
from apps.inventory.serializers.operations import (
    StockAdjustSerializer,
    StockIssueSerializer,
    StockManageSerializer,
    StockReceiveSerializer,
)
from apps.inventory.serializers.stock_movement import StockMovementSerializer
from apps.inventory.services import InventoryService
from apps.inventory.services.stock_health import (
    StockHealthStatus,
    compute_stock_health,
    prefetch_batches_for_stocks,
)


@extend_schema(tags=["Inventory - Stock"])
class StockViewSet(BaseModelViewSet):

    queryset = Stock.objects.select_related("product", "warehouse")
    permission_classes = [IsAuthenticated]
    search_fields = ["product__name", "product__sku", "warehouse__name"]
    filterset_fields = ["warehouse", "product"]
    ordering_fields = ["quantity", "created_at", "product__name"]
    http_method_names = ["get", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("partial_update", "update", "manage"):
            return [IsAuthenticated(), CanUpdateStockList()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ["partial_update", "update"]:
            return StockThresholdUpdateSerializer
        if self.action == "retrieve":
            return StockDetailSerializer
        return StockListSerializer

    def _health_filtered_stocks(self, queryset, health_filter):
        items = list(queryset)
        prefetch_batches_for_stocks(items)
        if not health_filter:
            return items
        return [
            stock
            for stock in items
            if compute_stock_health(stock, getattr(stock, "_health_batches", []))[
                "health_status"
            ]
            == health_filter
        ]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        health_filter = request.query_params.get("health_status")

        if health_filter:
            items = self._health_filtered_stocks(queryset, health_filter)
            page = self.paginate_queryset(items)
            serializer = StockListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        page = self.paginate_queryset(queryset)
        if page is not None:
            items = list(page)
            prefetch_batches_for_stocks(items)
            serializer = StockListSerializer(items, many=True)
            return self.get_paginated_response(serializer.data)

        items = list(queryset)
        prefetch_batches_for_stocks(items)
        return ApiResponse.success(
            message="Stock records retrieved.",
            data=StockListSerializer(items, many=True).data,
        )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        prefetch_batches_for_stocks([instance])
        return ApiResponse.success(
            message="Stock record retrieved.",
            data=StockDetailSerializer(instance).data,
        )

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = StockThresholdUpdateSerializer(
            instance, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        prefetch_batches_for_stocks([instance])
        return ApiResponse.success(
            message="Stock thresholds updated.",
            data=StockDetailSerializer(instance).data,
        )

    @extend_schema(
        summary="Manage stock record",
        description=(
            "Admin/manager actions: update reorder levels, adjust quantity, "
            "write off expired batches, or top-up low stock."
        ),
        request=StockManageSerializer,
    )
    @action(detail=True, methods=["post"], url_path="manage")
    def manage(self, request, pk=None):
        stock = self.get_object()
        serializer = StockManageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        action = data.pop("action")

        if action == StockManageSerializer.ACTION_UPDATE_THRESHOLDS:
            if "reorder_level" not in data and "max_stock_level" not in data:
                return ApiResponse.error(
                    message="Provide reorder_level and/or max_stock_level.",
                    status_code=400,
                )
        elif action == StockManageSerializer.ACTION_ADJUST_QUANTITY:
            if "new_quantity" not in data:
                return ApiResponse.error(message="new_quantity is required.", status_code=400)
        elif action == StockManageSerializer.ACTION_TOP_UP:
            if "quantity" not in data:
                return ApiResponse.error(message="quantity is required.", status_code=400)

        result = InventoryService.manage_stock(
            stock_id=stock.id,
            action=action,
            user=request.user,
            data=data,
        )
        updated_stock = result["stock"]
        prefetch_batches_for_stocks([updated_stock])
        payload = {"stock": StockDetailSerializer(updated_stock).data}
        if result["movement"]:
            payload["movement"] = StockMovementSerializer(result["movement"]).data

        messages = {
            StockManageSerializer.ACTION_UPDATE_THRESHOLDS: "Stock thresholds updated.",
            StockManageSerializer.ACTION_ADJUST_QUANTITY: "Stock quantity adjusted.",
            StockManageSerializer.ACTION_WRITE_OFF_EXPIRED: "Expired stock written off.",
            StockManageSerializer.ACTION_TOP_UP: "Stock topped up successfully.",
        }
        return ApiResponse.success(message=messages.get(action, "Stock updated."), data=payload)

    @extend_schema(
        summary="Low stock items",
        description="Returns stock records at or below their reorder level.",
        responses={200: StockListSerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        queryset = InventoryService.get_low_stock_queryset()
        page = self.paginate_queryset(queryset)
        items = list(page if page is not None else queryset)
        prefetch_batches_for_stocks(items)
        serializer = StockListSerializer(items, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return ApiResponse.success(
            message="Low stock items retrieved.",
            data=serializer.data,
        )

    @extend_schema(
        summary="Expiring batches",
        description="Batches expiring within 7 days (FEFO grocery alerts).",
    )
    @action(detail=False, methods=["get"], url_path="expiring")
    def expiring(self, request):
        within = int(request.query_params.get("within_days", 7))
        queryset = InventoryService.get_expiring_batches_queryset(within_days=within)
        page = self.paginate_queryset(queryset)
        rows = page if page is not None else queryset
        data = [
            {
                "batch_id": b.id,
                "product_name": b.product.name,
                "product_sku": b.product.sku,
                "warehouse_name": b.warehouse.name,
                "batch_number": b.batch_number,
                "quantity": b.quantity,
                "expiry_date": b.expiry_date,
                "days_left": (b.expiry_date - timezone.now().date()).days,
            }
            for b in rows
        ]
        if page is not None:
            return self.get_paginated_response(data)
        return ApiResponse.success(message="Expiring batches retrieved.", data=data)

    @extend_schema(
        summary="Stock health summary",
        description="Count of stock rows by health status (low, adequate, good, expiring).",
    )
    @action(detail=False, methods=["get"], url_path="health-summary")
    def health_summary(self, request):
        summary = InventoryService.get_health_summary()
        labels = {
            StockHealthStatus.LOW_STOCK: "Low stock",
            StockHealthStatus.ADEQUATE: "Adequate",
            StockHealthStatus.GOOD: "Good",
            StockHealthStatus.EXPIRING_SOON: "Expiring soon",
            StockHealthStatus.OUT_OF_STOCK: "Out of stock",
        }
        return ApiResponse.success(
            message="Stock health summary retrieved.",
            data={
                "counts": summary,
                "labels": labels,
            },
        )

    @extend_schema(
        summary="Receive stock",
        description="Record inbound stock (purchase, return, production).",
        request=StockReceiveSerializer,
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="receive",
        permission_classes=[IsAuthenticated, CanManageInventory],
    )
    def receive(self, request):
        serializer = StockReceiveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        stock, movement = InventoryService.receive_stock(
            product_id=data["product_id"],
            warehouse_id=data["warehouse_id"],
            quantity=data["quantity"],
            user=request.user,
            reference_number=data.get("reference_number", ""),
            notes=data.get("notes", ""),
            expiry_date=data.get("expiry_date"),
            batch_number=data.get("batch_number", ""),
        )
        prefetch_batches_for_stocks([stock])

        return ApiResponse.success(
            message="Stock received successfully.",
            data={
                "stock": StockDetailSerializer(stock).data,
                "movement": StockMovementSerializer(movement).data,
            },
        )

    @extend_schema(
        summary="Issue stock",
        description="Record outbound stock (sale, consumption, damage).",
        request=StockIssueSerializer,
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="issue",
        permission_classes=[IsAuthenticated, CanManageInventory],
    )
    def issue(self, request):
        serializer = StockIssueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        stock, movement = InventoryService.issue_stock(
            product_id=data["product_id"],
            warehouse_id=data["warehouse_id"],
            quantity=data["quantity"],
            user=request.user,
            reference_number=data.get("reference_number", ""),
            notes=data.get("notes", ""),
        )
        prefetch_batches_for_stocks([stock])

        return ApiResponse.success(
            message="Stock issued successfully.",
            data={
                "stock": StockDetailSerializer(stock).data,
                "movement": StockMovementSerializer(movement).data,
            },
        )

    @extend_schema(
        summary="Adjust stock",
        description="Correct on-hand quantity after physical count or audit.",
        request=StockAdjustSerializer,
    )
    @action(
        detail=False,
        methods=["post"],
        url_path="adjust",
        permission_classes=[IsAuthenticated, CanManageInventory],
    )
    def adjust(self, request):
        serializer = StockAdjustSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        stock, movement = InventoryService.adjust_stock(
            product_id=data["product_id"],
            warehouse_id=data["warehouse_id"],
            new_quantity=data["new_quantity"],
            user=request.user,
            notes=data.get("notes", ""),
        )
        prefetch_batches_for_stocks([stock])

        return ApiResponse.success(
            message="Stock adjusted successfully.",
            data={
                "stock": StockDetailSerializer(stock).data,
                "movement": StockMovementSerializer(movement).data,
            },
        )
