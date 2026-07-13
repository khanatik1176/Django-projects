from django.contrib import admin 
from django.urls import path, include


from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/accounts/", include("apps.accounts.urls")),
    path("api/products/", include("apps.products.urls")),
    path("api/inventory/", include("apps.inventory.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/finance/", include("apps.finance.urls")),
    path("api/", include("core.urls")),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    