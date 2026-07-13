from django.contrib import admin

from apps.orders.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    SalesOrder,
    SalesOrderItem,
)


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 0
    raw_id_fields = ["product"]


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ["po_number", "supplier", "warehouse", "status", "order_date"]
    list_filter = ["status"]
    search_fields = ["po_number"]
    inlines = [PurchaseOrderItemInline]
    raw_id_fields = ["supplier", "warehouse"]


class SalesOrderItemInline(admin.TabularInline):
    model = SalesOrderItem
    extra = 0
    raw_id_fields = ["product"]


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ["so_number", "customer_name", "warehouse", "status", "order_date"]
    list_filter = ["status"]
    search_fields = ["so_number", "customer_name"]
    inlines = [SalesOrderItemInline]
    raw_id_fields = ["warehouse"]
