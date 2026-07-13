from rest_framework.permissions import IsAuthenticated

from core.views.base import BaseModelViewSet

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