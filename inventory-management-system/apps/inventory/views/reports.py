from datetime import datetime
from decimal import Decimal

from django.db.models import Count, Sum
from django.db.models.functions import Coalesce
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from drf_spectacular.utils import OpenApiParameter, extend_schema

from core.api_response import ApiResponse

from apps.inventory.models import Stock, StockMovement
from apps.inventory.services import InventoryService


class StockValuationReportAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Inventory - Reports"],
        summary="Stock valuation report",
        description="Total inventory value by warehouse using product cost price.",
        parameters=[
            OpenApiParameter(name="warehouse", type=int, required=False),
        ],
    )
    def get(self, request):
        queryset = Stock.objects.select_related("product", "warehouse")

        warehouse_id = request.query_params.get("warehouse")
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

        rows = []
        grand_total = Decimal("0")

        for stock in queryset:
            unit_cost = stock.product.cost_price or Decimal("0")
            line_value = stock.quantity * unit_cost
            grand_total += line_value
            rows.append(
                {
                    "product_id": stock.product_id,
                    "product_name": stock.product.name,
                    "product_sku": stock.product.sku,
                    "warehouse_id": stock.warehouse_id,
                    "warehouse_name": stock.warehouse.name,
                    "quantity": stock.quantity,
                    "unit_cost": unit_cost,
                    "total_value": line_value,
                }
            )

        return ApiResponse.success(
            message="Stock valuation report generated.",
            data={
                "grand_total": grand_total,
                "items": rows,
            },
        )


class MovementSummaryReportAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Inventory - Reports"],
        summary="Movement summary report",
        description="Aggregated stock movements by type within a date range.",
        parameters=[
            OpenApiParameter(name="start_date", type=str, required=False),
            OpenApiParameter(name="end_date", type=str, required=False),
            OpenApiParameter(name="warehouse", type=int, required=False),
        ],
    )
    def get(self, request):
        queryset = StockMovement.objects.all()

        warehouse_id = request.query_params.get("warehouse")
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if start_date:
            queryset = queryset.filter(
                created_at__date__gte=datetime.strptime(start_date, "%Y-%m-%d").date()
            )
        if end_date:
            queryset = queryset.filter(
                created_at__date__lte=datetime.strptime(end_date, "%Y-%m-%d").date()
            )

        summary = (
            queryset.values("movement_type")
            .annotate(
                total_quantity=Coalesce(Sum("quantity"), Decimal("0")),
                transaction_count=Count("id"),
            )
            .order_by("movement_type")
        )

        return ApiResponse.success(
            message="Movement summary report generated.",
            data={
                "total_movements": queryset.count(),
                "by_type": list(summary),
            },
        )


class ABCAnalysisReportAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Inventory - Reports"],
        summary="ABC analysis report",
        description=(
            "Classifies products by inventory value contribution. "
            "A = top 80%, B = next 15%, C = remaining 5%."
        ),
        parameters=[
            OpenApiParameter(name="warehouse", type=int, required=False),
        ],
    )
    def get(self, request):
        queryset = Stock.objects.select_related("product", "warehouse")

        warehouse_id = request.query_params.get("warehouse")
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)

        product_values = {}
        for stock in queryset:
            unit_cost = stock.product.cost_price or Decimal("0")
            value = stock.quantity * unit_cost
            key = stock.product_id
            if key not in product_values:
                product_values[key] = {
                    "product_id": stock.product_id,
                    "product_name": stock.product.name,
                    "product_sku": stock.product.sku,
                    "total_quantity": Decimal("0"),
                    "total_value": Decimal("0"),
                }
            product_values[key]["total_quantity"] += stock.quantity
            product_values[key]["total_value"] += value

        ranked = sorted(
            product_values.values(),
            key=lambda x: x["total_value"],
            reverse=True,
        )

        grand_total = sum(item["total_value"] for item in ranked) or Decimal("1")
        cumulative = Decimal("0")
        results = []

        for item in ranked:
            cumulative += item["total_value"]
            pct = (item["total_value"] / grand_total) * 100
            cumulative_pct = (cumulative / grand_total) * 100

            if cumulative_pct <= 80:
                classification = "A"
            elif cumulative_pct <= 95:
                classification = "B"
            else:
                classification = "C"

            results.append(
                {
                    **item,
                    "value_percentage": round(pct, 2),
                    "cumulative_percentage": round(cumulative_pct, 2),
                    "classification": classification,
                }
            )

        return ApiResponse.success(
            message="ABC analysis report generated.",
            data={
                "grand_total": grand_total,
                "products": results,
            },
        )


class InventoryDashboardAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Inventory - Dashboard"],
        summary="Inventory dashboard",
        description="High-level inventory KPIs for operations overview.",
    )
    def get(self, request):
        from apps.orders.models import PurchaseOrder, PurchaseOrderStatus
        from apps.orders.models import SalesOrder, SalesOrderStatus

        summary = InventoryService.get_dashboard_summary()
        summary["open_purchase_orders"] = PurchaseOrder.objects.filter(
            status__in=[
                PurchaseOrderStatus.SUBMITTED,
                PurchaseOrderStatus.PARTIALLY_RECEIVED,
            ]
        ).count()
        summary["open_sales_orders"] = SalesOrder.objects.filter(
            status__in=[
                SalesOrderStatus.CONFIRMED,
                SalesOrderStatus.PARTIALLY_FULFILLED,
            ]
        ).count()

        stock_value = Decimal("0")
        for stock in Stock.objects.select_related("product"):
            stock_value += stock.quantity * (stock.product.cost_price or Decimal("0"))
        summary["total_inventory_value"] = stock_value
        summary["health_summary"] = InventoryService.get_health_summary()
        summary["expiring_soon_items"] = summary.get(
            "expiring_soon_items",
            InventoryService.get_expiring_batches_queryset().count(),
        )

        return ApiResponse.success(
            message="Dashboard summary retrieved.",
            data=summary,
        )
