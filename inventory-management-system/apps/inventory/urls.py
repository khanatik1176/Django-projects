from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.inventory.views import (
    ABCAnalysisReportAPIView,
    ClearanceHubAPIView,
    InventoryDashboardAPIView,
    MovementSummaryReportAPIView,
    POSCheckoutAPIView,
    ShopInsightsAPIView,
    StockMovementViewSet,
    StockTransferViewSet,
    StockValuationReportAPIView,
    StockViewSet,
    WarehouseViewSet,
)

router = DefaultRouter()

router.register("warehouses", WarehouseViewSet, basename="warehouse")
router.register("stock", StockViewSet, basename="stock")
router.register("movements", StockMovementViewSet, basename="stock-movement")
router.register("transfers", StockTransferViewSet, basename="stock-transfer")

urlpatterns = [
    path("dashboard/", InventoryDashboardAPIView.as_view(), name="inventory-dashboard"),
    path("shop-insights/", ShopInsightsAPIView.as_view(), name="shop-insights"),
    path("clearance/", ClearanceHubAPIView.as_view(), name="clearance-hub"),
    path("pos/checkout/", POSCheckoutAPIView.as_view(), name="pos-checkout"),
    path(
        "reports/stock-valuation/",
        StockValuationReportAPIView.as_view(),
        name="stock-valuation-report",
    ),
    path(
        "reports/movement-summary/",
        MovementSummaryReportAPIView.as_view(),
        name="movement-summary-report",
    ),
    path(
        "reports/abc-analysis/",
        ABCAnalysisReportAPIView.as_view(),
        name="abc-analysis-report",
    ),
] + router.urls
