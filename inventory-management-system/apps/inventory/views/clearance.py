from django.utils import timezone

from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse

from apps.inventory.services import InventoryService
from apps.inventory.services.shop_insights import ShopInsightsService


def _suggested_discount(days_left):
    if days_left is None:
        return 0
    if days_left <= 0:
        return 50
    if days_left <= 2:
        return 35
    if days_left <= 5:
        return 20
    if days_left <= 7:
        return 10
    return 0


@extend_schema(tags=["Inventory - Clearance"])
class ClearanceHubAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Clearance & expiry hub",
        description="Expiring batches with suggested ছাড় (discount) plus dead-stock clearance ideas.",
    )
    def get(self, request):
        today = timezone.now().date()
        expiring = []
        total_risk = 0

        for batch in InventoryService.get_expiring_batches_queryset(within_days=14):
            days_left = (batch.expiry_date - today).days
            unit_cost = batch.product.cost_price or 0
            sell = batch.product.selling_price or 0
            discount = _suggested_discount(days_left)
            clearance_price = sell * (100 - discount) / 100 if sell else 0
            at_risk = batch.quantity * unit_cost
            total_risk += at_risk

            expiring.append(
                {
                    "batch_id": batch.id,
                    "stock_id": batch.stock_id,
                    "product_name": batch.product.name,
                    "product_sku": batch.product.sku,
                    "warehouse_name": batch.warehouse.name,
                    "quantity": batch.quantity,
                    "expiry_date": batch.expiry_date,
                    "days_left": days_left,
                    "is_expired": days_left < 0,
                    "selling_price": sell,
                    "suggested_discount_percent": discount,
                    "clearance_price": round(clearance_price, 2),
                    "at_risk_value": at_risk,
                    "action": "Write off" if days_left < 0 else f"Sell at {discount}% off",
                }
            )

        insights = ShopInsightsService.get_insights(request.user)
        dead_stock = insights.get("manager_panel", {}).get("dead_stock") or insights.get(
            "admin_panel", {}
        ).get("dead_stock", [])

        return ApiResponse.success(
            message="Clearance hub data retrieved.",
            data={
                "expiring_items": expiring,
                "expiring_count": len(expiring),
                "total_at_risk_value": total_risk,
                "dead_stock": dead_stock[:10],
                "tip": "মেয়াদ শেষের আগে কাউন্টারে ছাড় দিলে ক্ষতি কমে — FEFO মেনে বিক্রি করুন।",
            },
        )
