from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.accounts.models import AccountStatus, User
from apps.inventory.models import Stock, StockMovement
from apps.inventory.services.inventory_service import InventoryService
from apps.inventory.services.stock_health import (
    EXPIRY_WARNING_DAYS,
    compute_stock_health,
    prefetch_batches_for_stocks,
)
from apps.orders.models import PurchaseOrder, PurchaseOrderStatus
from apps.orders.models import SalesOrder, SalesOrderStatus


class ShopInsightsService:
    """Role-tailored insights for Bangladesh grocery shop owners."""

    @staticmethod
    def _role_code(user):
        if user.is_superuser:
            return "ADMIN"
        return user.role.code if user.role else "VIEWER"

    @staticmethod
    def _stock_row(stock, health):
        return {
            "stock_id": stock.id,
            "product_name": stock.product.name,
            "product_sku": stock.product.sku,
            "warehouse_name": stock.warehouse.name,
            "quantity": stock.quantity,
            "reorder_level": stock.reorder_level,
            "health_status": health["health_status"],
            "health_label": health["health_label"],
            "days_to_expiry": health["days_to_expiry"],
            "expiring_quantity": health["expiring_quantity"],
            "selling_price": stock.product.selling_price,
            "cost_price": stock.product.cost_price,
            "supplier_name": stock.product.supplier.name
            if stock.product.supplier_id
            else "",
        }

    @staticmethod
    def _reorder_suggestions(limit=8):
        stocks = list(
            InventoryService.get_low_stock_queryset()[:limit]
        )
        prefetch_batches_for_stocks(stocks)
        items = []
        for stock in stocks:
            health = compute_stock_health(stock, getattr(stock, "_health_batches", []))
            suggested = max(
                stock.reorder_level * 2 - stock.quantity,
                stock.reorder_level,
            )
            items.append(
                {
                    **ShopInsightsService._stock_row(stock, health),
                    "suggested_order_qty": suggested,
                    "supplier_phone": getattr(stock.product.supplier, "phone", ""),
                }
            )
        return items

    @staticmethod
    def _expiring_batches(limit=10):
        rows = []
        for batch in InventoryService.get_expiring_batches_queryset(
            within_days=EXPIRY_WARNING_DAYS
        )[:limit]:
            days_left = (batch.expiry_date - timezone.now().date()).days
            rows.append(
                {
                    "batch_id": batch.id,
                    "product_name": batch.product.name,
                    "product_sku": batch.product.sku,
                    "warehouse_name": batch.warehouse.name,
                    "batch_number": batch.batch_number,
                    "quantity": batch.quantity,
                    "expiry_date": batch.expiry_date,
                    "days_left": days_left,
                    "at_risk_value": batch.quantity * (batch.product.cost_price or 0),
                }
            )
        return rows

    @staticmethod
    def _dead_stock(limit=6, inactive_days=30):
        cutoff = timezone.now() - timedelta(days=inactive_days)
        moved_ids = (
            StockMovement.objects.filter(created_at__gte=cutoff)
            .values_list("product_id", flat=True)
            .distinct()
        )
        stocks = (
            Stock.objects.select_related("product", "warehouse")
            .filter(quantity__gt=0)
            .exclude(product_id__in=moved_ids)[:limit]
        )
        prefetch_batches_for_stocks(stocks)
        return [
            ShopInsightsService._stock_row(
                s, compute_stock_health(s, getattr(s, "_health_batches", []))
            )
            for s in stocks
        ]

    @staticmethod
    def _open_po_queue(limit=8):
        orders = PurchaseOrder.objects.filter(
            status__in=[
                PurchaseOrderStatus.SUBMITTED,
                PurchaseOrderStatus.PARTIALLY_RECEIVED,
            ]
        ).select_related("supplier")[:limit]
        return [
            {
                "id": po.id,
                "po_number": po.po_number,
                "supplier_name": po.supplier.name,
                "status": po.status,
                "total_cost": po.total_cost,
            }
            for po in orders
        ]

    @staticmethod
    def _open_so_queue(limit=8):
        orders = SalesOrder.objects.filter(
            status__in=[
                SalesOrderStatus.CONFIRMED,
                SalesOrderStatus.PARTIALLY_FULFILLED,
            ]
        )[:limit]
        return [
            {
                "id": so.id,
                "so_number": so.so_number,
                "customer_name": so.customer_name,
                "status": so.status,
                "total_revenue": so.total_revenue,
            }
            for so in orders
        ]

    @staticmethod
    def _margin_snapshot():
        total_cost = Decimal("0")
        total_retail = Decimal("0")
        for stock in Stock.objects.select_related("product"):
            total_cost += stock.quantity * (stock.product.cost_price or 0)
            total_retail += stock.quantity * (stock.product.selling_price or 0)
        margin = total_retail - total_cost
        margin_pct = (margin / total_retail * 100) if total_retail else Decimal("0")
        return {
            "inventory_cost_value": total_cost,
            "inventory_retail_value": total_retail,
            "potential_margin": margin,
            "margin_percent": round(margin_pct, 1),
        }

    @staticmethod
    def get_insights(user):
        role = ShopInsightsService._role_code(user)
        health_summary = InventoryService.get_health_summary()
        expiring = ShopInsightsService._expiring_batches()
        reorder = ShopInsightsService._reorder_suggestions()

        base = {
            "role_code": role,
            "role_name": user.role.name if user.role else "Viewer",
            "health_summary": health_summary,
            "expiring_batches": expiring,
            "reorder_suggestions": reorder,
            "daily_tip": ShopInsightsService._daily_tip(role),
        }

        if role == "ADMIN" or user.can_manage_config:
            pending_users = User.objects.filter(
                account_status=AccountStatus.PENDING
            ).count()
            banned_users = User.objects.filter(
                account_status=AccountStatus.BANNED
            ).count()
            expiring_risk = sum(item["at_risk_value"] for item in expiring)
            base["admin_panel"] = {
                "pending_approvals": pending_users,
                "banned_users": banned_users,
                "margin_snapshot": ShopInsightsService._margin_snapshot(),
                "expiring_loss_risk": expiring_risk,
                "dead_stock": ShopInsightsService._dead_stock(),
                "headline": "দোকানের সারাংশ — আজকের ব্যবসার ছবি",
            }

        if role in ("ADMIN", "MANAGER") or (
            user.role and user.role.can_manage_orders
        ):
            base["manager_panel"] = {
                "open_purchase_orders": ShopInsightsService._open_po_queue(),
                "open_sales_orders": ShopInsightsService._open_so_queue(),
                "dead_stock": ShopInsightsService._dead_stock(),
                "headline": "আজ কী করবেন — রিস্টক ও বিক্রি অগ্রাধিকার",
            }

        if role == "WAREHOUSE" or (
            user.role and user.role.can_manage_inventory and role != "VIEWER"
        ):
            base["warehouse_panel"] = {
                "receive_queue": ShopInsightsService._open_po_queue(),
                "pick_list": ShopInsightsService._open_so_queue(),
                "fefo_alerts": expiring,
                "shelf_refill": reorder[:6],
                "headline": "গুদাম ডেস্ক — আগে মেয়াদ শেষ, তারপর পিক",
            }

        if role == "VIEWER" or (
            user.role and user.role.can_view_reports and not user.role.can_manage_inventory
        ):
            top_products = (
                Stock.objects.select_related("product")
                .order_by("-quantity")[:8]
            )
            base["viewer_panel"] = {
                "price_board": [
                    {
                        "product_name": s.product.name,
                        "sku": s.product.sku,
                        "selling_price": s.product.selling_price,
                        "quantity": s.quantity,
                        "unit": s.product.unit_of_measure,
                    }
                    for s in top_products
                ],
                "movement_today": StockMovement.objects.filter(
                    created_at__date=timezone.now().date()
                ).count(),
                "headline": "দাম তালিকা — কাউন্টারে দ্রুত দেখুন",
            }

        return base

    @staticmethod
    def _daily_tip(role):
        tips = {
            "ADMIN": "প্রতিদিন সকালে মেয়াদোত্তীর্ণ ও লো স্টক চেক করলে ক্ষতি ৩০% কমে।",
            "MANAGER": "FEFO মানুন — আগে যা শীঘ্র মেয়াদ শেষ, সেটা আগে বিক্রি করুন।",
            "WAREHOUSE": "রিসিভ করার সময় এক্সপায়ারি ডেট লিখলে সিস্টেম স্বয়ংক্রিয় সতর্ক করবে।",
            "VIEWER": "কাউন্টারে দাম জানতে প্রোডাক্ট SKU সার্চ করুন।",
        }
        return tips.get(role, tips["VIEWER"])
