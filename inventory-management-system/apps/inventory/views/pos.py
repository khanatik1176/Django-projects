from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse

from apps.accounts.permissions import CanManageInventory
from apps.inventory.serializers.pos import POSCheckoutSerializer
from apps.inventory.services.pos_service import POSService


@extend_schema(tags=["Inventory - POS"])
class POSCheckoutAPIView(APIView):

    permission_classes = [IsAuthenticated, CanManageInventory]

    @extend_schema(
        summary="Counter POS checkout",
        description="Scan-and-sell checkout: confirms order, issues stock, supports cash/bKash/Nagad/udhar.",
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
        )
        so = result["sales_order"]

        return ApiResponse.success(
            message="Sale completed successfully.",
            data={
                "so_number": so.so_number,
                "total": str(result["total"]),
                "payment_method": result["payment_method"],
                "item_count": result["item_count"],
                "status": so.status,
            },
        )
