from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from core.views.base import BaseModelViewSet
from core.api_response import ApiResponse

from apps.products.models import Product

from apps.products.serializers.product import (
    ProductListSerializer,
    ProductDetailSerializer,
    ProductCreateSerializer,
    ProductUpdateSerializer,
)
    
from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=["Products"]
)

class ProductViewSet(BaseModelViewSet):

    queryset = Product.objects.select_related(
        "category",
        "brand",
        "supplier",
    )

    permission_classes = [IsAuthenticated]
    search_fields = ["name", "sku", "barcode"]
    filterset_fields = ["category", "brand", "supplier", "is_active"]
    ordering_fields = ["name", "created_at", "sku"]

    def get_serializer_class(self):

        if self.action == "list":
            return ProductListSerializer

        if self.action == "retrieve":
            return ProductDetailSerializer

        if self.action == "create":
            return ProductCreateSerializer

        if self.action in ["update", "partial_update"]:
            return ProductUpdateSerializer

        return ProductDetailSerializer

    @extend_schema(
        summary="Lookup product by barcode",
        description="Scan or enter a barcode to retrieve product details.",
        responses={200: ProductDetailSerializer},
    )
    @action(detail=False, methods=["get"], url_path=r"by-barcode/(?P<barcode>[^/.]+)")
    def by_barcode(self, request, barcode=None):
        try:
            product = self.get_queryset().get(barcode=barcode)
        except Product.DoesNotExist:
            return ApiResponse.error(
                message="Product not found for this barcode.",
                status_code=404,
            )

        return ApiResponse.success(
            message="Product found.",
            data=ProductDetailSerializer(product).data,
        )