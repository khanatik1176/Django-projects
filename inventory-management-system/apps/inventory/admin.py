from django.contrib import admin

from apps.inventory.models import (
    Stock,
    StockBatch,
    StockMovement,
    StockTransfer,
    Warehouse,
)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ["code", "name", "is_default", "is_active", "created_at"]
    search_fields = ["name", "code"]
    list_filter = ["is_active", "is_default"]


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "warehouse",
        "quantity",
        "reserved_quantity",
        "reorder_level",
        "updated_at",
    ]
    search_fields = ["product__name", "product__sku", "warehouse__name"]
    list_filter = ["warehouse"]
    raw_id_fields = ["product", "warehouse"]


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "warehouse",
        "movement_type",
        "quantity",
        "quantity_before",
        "quantity_after",
        "created_at",
    ]
    search_fields = ["product__sku", "reference_number"]
    list_filter = ["movement_type", "warehouse"]
    raw_id_fields = ["product", "warehouse", "stock_transfer"]


@admin.register(StockTransfer)
class StockTransferAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "from_warehouse",
        "to_warehouse",
        "quantity",
        "status",
        "created_at",
    ]
    list_filter = ["status"]
    raw_id_fields = ["product", "from_warehouse", "to_warehouse"]


@admin.register(StockBatch)
class StockBatchAdmin(admin.ModelAdmin):
    list_display = [
        "product",
        "warehouse",
        "batch_number",
        "quantity",
        "expiry_date",
        "received_at",
    ]
    search_fields = ["product__sku", "batch_number"]
    list_filter = ["warehouse", "expiry_date"]
    raw_id_fields = ["stock", "product", "warehouse"]
