from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.views.base import BaseModelViewSet

from apps.orders.models import CreditTransaction, Customer, PointsLedger
from apps.orders.serializers.customer import (
    AdjustPointsSerializer,
    AssignMembershipSerializer,
    CreditPaymentSerializer,
    CreditTransactionSerializer,
    CustomerSerializer,
    PointsLedgerSerializer,
)
from apps.orders.services.credit_service import CreditService
from apps.orders.services.loyalty_service import LoyaltyService
from apps.finance.services import ActivityService, FinanceService
from rest_framework.exceptions import NotFound


@extend_schema(tags=["Orders - Customers"])
class CustomerViewSet(BaseModelViewSet):

    queryset = Customer.objects.select_related("membership").all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "phone", "address"]
    filterset_fields = ["is_active", "membership"]
    ordering_fields = ["name", "credit_balance", "loyalty_points", "created_at"]

    def destroy(self, request, *args, **kwargs):
        customer = self.get_object()
        customer.is_active = False
        customer.save(update_fields=["is_active", "updated_at"])

        ActivityService.log(
            action="DEACTIVATE",
            module="orders",
            entity_type="Customer",
            entity_id=customer.id,
            entity_label=customer.name,
            description=f"Deactivated customer {customer.name}",
            user=request.user,
        )
        return ApiResponse.success(message="Customer banned.")

    @extend_schema(summary="Lookup customer by phone")
    @action(detail=False, methods=["get"], url_path="by-phone")
    def by_phone(self, request):
        phone = (request.query_params.get("phone") or "").strip()
        if not phone:
            return ApiResponse.error(message="Phone number is required.")

        digits = "".join(ch for ch in phone if ch.isdigit())
        qs = Customer.objects.select_related("membership").filter(is_active=True)
        customer = (
            qs.filter(phone=phone).first()
            or (qs.filter(phone=digits).first() if digits else None)
            or (qs.filter(phone__icontains=digits).first() if len(digits) >= 4 else None)
        )
        if not customer:
            raise NotFound("No customer found with this phone number.")

        return ApiResponse.success(
            message="Customer found.",
            data=CustomerSerializer(customer).data,
        )

    @extend_schema(summary="Ban customer (deactivate)")
    @action(detail=True, methods=["post"], url_path="ban")
    def ban(self, request, pk=None):
        customer = self.get_object()
        customer.is_active = False
        customer.save(update_fields=["is_active", "updated_at"])
        ActivityService.log(
            action="BAN",
            module="orders",
            entity_type="Customer",
            entity_id=customer.id,
            entity_label=customer.name,
            description=f"Banned customer {customer.name}",
            user=request.user,
        )
        return ApiResponse.success(
            message="Customer banned.",
            data=CustomerSerializer(customer).data,
        )

    @extend_schema(summary="Unban customer (reactivate)")
    @action(detail=True, methods=["post"], url_path="unban")
    def unban(self, request, pk=None):
        customer = self.get_object()
        customer.is_active = True
        customer.save(update_fields=["is_active", "updated_at"])
        ActivityService.log(
            action="UNBAN",
            module="orders",
            entity_type="Customer",
            entity_id=customer.id,
            entity_label=customer.name,
            description=f"Unbanned customer {customer.name}",
            user=request.user,
        )
        return ApiResponse.success(
            message="Customer unbanned.",
            data=CustomerSerializer(customer).data,
        )

    @extend_schema(summary="Record udhar payment", request=CreditPaymentSerializer)
    @action(detail=True, methods=["post"], url_path="collect-payment")
    def collect_payment(self, request, pk=None):
        customer = self.get_object()
        serializer = CreditPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        txn = CreditService.record_payment(
            customer_id=customer.id,
            amount=data["amount"],
            user=request.user,
            notes=data.get("notes", ""),
        )
        FinanceService.record_credit_collection(
            amount=data["amount"],
            customer_id=customer.id,
            user=request.user,
            payment_method=data.get("payment_method", "CASH"),
            notes=data.get("notes", ""),
        )
        customer.refresh_from_db()

        return ApiResponse.success(
            message="Payment recorded.",
            data={
                "customer": CustomerSerializer(customer).data,
                "transaction": CreditTransactionSerializer(txn).data,
            },
        )

    @extend_schema(summary="Customer credit history")
    @action(detail=True, methods=["get"], url_path="transactions")
    def transactions(self, request, pk=None):
        customer = self.get_object()
        txns = CreditTransaction.objects.filter(customer=customer)[:50]
        return ApiResponse.success(
            message="Transactions retrieved.",
            data=CreditTransactionSerializer(txns, many=True).data,
        )

    @extend_schema(summary="Customer loyalty points history")
    @action(detail=True, methods=["get"], url_path="points-ledger")
    def points_ledger(self, request, pk=None):
        customer = self.get_object()
        entries = PointsLedger.objects.filter(customer=customer).select_related("offer")[:50]
        return ApiResponse.success(
            message="Points ledger retrieved.",
            data=PointsLedgerSerializer(entries, many=True).data,
        )

    @extend_schema(summary="Assign membership tier", request=AssignMembershipSerializer)
    @action(detail=True, methods=["post"], url_path="assign-membership")
    def assign_membership(self, request, pk=None):
        serializer = AssignMembershipSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = LoyaltyService.assign_membership(
            customer_id=pk,
            membership_id=serializer.validated_data.get("membership_id"),
            user=request.user,
        )
        return ApiResponse.success(
            message="Membership updated.",
            data=CustomerSerializer(customer).data,
        )

    @extend_schema(summary="Adjust loyalty points", request=AdjustPointsSerializer)
    @action(detail=True, methods=["post"], url_path="adjust-points")
    def adjust_points(self, request, pk=None):
        serializer = AdjustPointsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = LoyaltyService.adjust_points(
            customer_id=pk,
            points=serializer.validated_data["points"],
            notes=serializer.validated_data.get("notes", ""),
            user=request.user,
        )
        customer = Customer.objects.select_related("membership").get(pk=pk)
        return ApiResponse.success(
            message="Points adjusted.",
            data={
                "customer": CustomerSerializer(customer).data,
                "entry": PointsLedgerSerializer(entry).data,
            },
        )
