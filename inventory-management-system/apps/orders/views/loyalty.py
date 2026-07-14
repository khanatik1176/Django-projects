from django.db.models import Q
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.views.base import BaseModelViewSet

from apps.accounts.permissions import CanManageConfig
from apps.orders.models import LoyaltyOffer, MembershipTier
from apps.orders.serializers.customer import (
    LoyaltyOfferSerializer,
    MembershipTierSerializer,
)


@extend_schema(tags=["Loyalty - Memberships"])
class MembershipTierViewSet(BaseModelViewSet):
    queryset = MembershipTier.objects.all()
    serializer_class = MembershipTierSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "code", "description"]
    filterset_fields = ["is_active", "is_system"]
    ordering_fields = ["sort_order", "min_points", "name"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), CanManageConfig()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(is_system=False)

    def destroy(self, request, *args, **kwargs):
        tier = self.get_object()
        if tier.is_system:
            return ApiResponse.error(
                message="Built-in memberships cannot be deleted. Deactivate instead."
            )
        return super().destroy(request, *args, **kwargs)


@extend_schema(tags=["Loyalty - Offers"])
class LoyaltyOfferViewSet(BaseModelViewSet):
    queryset = LoyaltyOffer.objects.select_related("membership").all()
    serializer_class = LoyaltyOfferSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["title", "description"]
    filterset_fields = ["is_active", "offer_type", "membership"]
    ordering_fields = ["created_at", "points_cost", "title"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), CanManageConfig()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        membership_id = self.request.query_params.get("for_membership")
        if membership_id:
            qs = qs.filter(Q(membership_id=membership_id) | Q(membership__isnull=True))
        active = self.request.query_params.get("active_only")
        if active in ("1", "true", "True"):
            qs = qs.filter(is_active=True)
        return qs
