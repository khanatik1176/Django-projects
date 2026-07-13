from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.finance.views import (
    ActivityLogViewSet,
    ExpenseViewSet,
    FinanceSummaryAPIView,
    PaymentViewSet,
)

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")
router.register("expenses", ExpenseViewSet, basename="expense")
router.register("activity-logs", ActivityLogViewSet, basename="activity-log")

urlpatterns = [
    path("summary/", FinanceSummaryAPIView.as_view(), name="finance-summary"),
    path("", include(router.urls)),
]
