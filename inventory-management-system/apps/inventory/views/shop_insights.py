from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse

from apps.inventory.services.shop_insights import ShopInsightsService


class ShopInsightsAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Inventory - Dashboard"],
        summary="Role-based shop insights",
        description=(
            "Tailored grocery shop intelligence per user role — "
            "admin margin pulse, manager reorder list, warehouse FEFO alerts, "
            "viewer price board."
        ),
    )
    def get(self, request):
        data = ShopInsightsService.get_insights(request.user)
        return ApiResponse.success(
            message="Shop insights retrieved.",
            data=data,
        )
