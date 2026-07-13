from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse

from apps.accounts.permissions import CanViewReports
from apps.finance.models import ActivityLog, Expense, Payment
from apps.finance.serializers import (
    ActivityLogSerializer,
    ExpenseCreateSerializer,
    ExpenseSerializer,
    PaymentSerializer,
)
from apps.finance.services import ActivityService, FinanceService


class FinanceSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated, CanViewReports]

    @extend_schema(tags=["Finance"], summary="Financial dashboard summary")
    def get(self, request):
        return ApiResponse.success(
            message="Financial summary retrieved.",
            data=FinanceService.get_summary(),
        )


@extend_schema(tags=["Finance"])
class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.select_related("customer", "created_by")
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, CanViewReports]
    filterset_fields = ["payment_type", "direction", "payment_method"]
    search_fields = ["description"]
    ordering_fields = ["created_at", "amount"]


@extend_schema(tags=["Finance"])
class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("created_by")
    permission_classes = [IsAuthenticated, CanViewReports]
    filterset_fields = ["category", "payment_method"]
    search_fields = ["description", "notes"]
    ordering_fields = ["expense_date", "amount", "created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def perform_create(self, serializer):
        expense = serializer.save(created_by=self.request.user)
        FinanceService.record_expense(expense=expense, user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        expense = self.get_object()
        expense.delete()
        ActivityService.log(
            action="DELETE",
            module="finance",
            entity_type="Expense",
            entity_id=expense.id,
            entity_label=expense.description,
            description=f"Deleted expense: {expense.description}",
            user=request.user,
        )
        return ApiResponse.success(message="Expense deleted.")


@extend_schema(tags=["Finance - Activity"])
class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related("user")
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, CanViewReports]
    filterset_fields = ["module", "action", "entity_type"]
    search_fields = ["description", "entity_label", "user_email"]
    ordering_fields = ["created_at"]
