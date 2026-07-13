from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.views.base import BaseModelViewSet

from apps.orders.models import CreditTransaction, Customer
from apps.orders.serializers.customer import (
    CreditPaymentSerializer,
    CreditTransactionSerializer,
    CustomerSerializer,
)
from apps.orders.services.credit_service import CreditService
from apps.finance.services import ActivityService, FinanceService


@extend_schema(tags=["Orders - Customers"])
class CustomerViewSet(BaseModelViewSet):

    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ["name", "phone", "address"]
    filterset_fields = ["is_active"]
    ordering_fields = ["name", "credit_balance", "created_at"]

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
        return ApiResponse.success(message="Customer deactivated.")

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
