from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse

from apps.accounts.permissions import CanManageInventory
from apps.inventory.serializers.pos import POSCheckoutSerializer
from apps.inventory.services.pos_service import POSService
from apps.orders.models import SalesOrder


@extend_schema(tags=["Inventory - POS"])
class POSCheckoutAPIView(APIView):

    permission_classes = [IsAuthenticated, CanManageInventory]

    @extend_schema(
        summary="Counter POS checkout",
        description=(
            "Scan-and-sell checkout with optional membership discount, "
            "offer redemption, and loyalty points."
        ),
        request=POSCheckoutSerializer,
    )
    def post(self, request):
        serializer = POSCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = POSService.checkout(
            warehouse_id=data["warehouse_id"],
            items=data["items"],
            user=request.user,
            customer_name=data.get("customer_name", "Walk-in Customer"),
            customer_phone=data.get("customer_phone", ""),
            payment_method=data["payment_method"],
            customer_id=data.get("customer_id"),
            notes=data.get("notes", ""),
            redeem_offer_id=data.get("redeem_offer_id"),
        )
        so = result["sales_order"]
        so = SalesOrder.objects.prefetch_related("items__product").select_related(
            "warehouse"
        ).get(pk=so.id)

        return ApiResponse.success(
            message="Sale completed successfully.",
            data={
                "id": so.id,
                "so_number": so.so_number,
                "invoice_number": so.so_number,
                "total": str(result["total"]),
                "subtotal": str(result["subtotal"]),
                "membership_discount": str(result["membership_discount"]),
                "offer_discount": str(result["offer_discount"]),
                "points_earned": result["points_earned"],
                "payment_method": result["payment_method"],
                "item_count": result["item_count"],
                "status": so.status,
                "customer_name": so.customer_name,
                "customer_phone": so.customer_phone or "",
                "warehouse_name": so.warehouse.name if so.warehouse_id else "",
                "order_date": so.order_date.isoformat() if so.order_date else None,
                "created_at": so.created_at.isoformat() if so.created_at else None,
                "items": [
                    {
                        "product_name": item.product.name,
                        "product_sku": item.product.sku,
                        "quantity": str(item.quantity_ordered),
                        "unit_price": str(item.unit_price),
                        "line_total": str(item.line_total),
                    }
                    for item in so.items.all()
                ],
            },
        )
