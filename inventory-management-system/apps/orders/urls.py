from rest_framework.routers import DefaultRouter

from apps.orders.views import PurchaseOrderViewSet, SalesOrderViewSet
from apps.orders.views.customer import CustomerViewSet

router = DefaultRouter()

router.register("purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register("sales-orders", SalesOrderViewSet, basename="sales-order")
router.register("customers", CustomerViewSet, basename="customer")

urlpatterns = router.urls
