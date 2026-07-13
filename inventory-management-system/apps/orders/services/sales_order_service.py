from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.inventory.services import InventoryService
from apps.finance.services import ActivityService

from apps.orders.models import (
    SalesOrder,
    SalesOrderItem,
    SalesOrderStatus,
)


class SalesOrderService:

    @staticmethod
    def _generate_so_number():
        today = timezone.localdate().strftime("%Y%m%d")
        prefix = f"SO-{today}-"
        last = (
            SalesOrder.all_objects.filter(so_number__startswith=prefix)
            .order_by("-so_number")
            .first()
        )
        if last:
            seq = int(last.so_number.split("-")[-1]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"

    @staticmethod
    def _refresh_so_status(sales_order):
        items = list(sales_order.items.all())
        if not items:
            return sales_order

        all_fulfilled = all(item.is_fully_fulfilled for item in items)
        any_fulfilled = any(item.quantity_fulfilled > 0 for item in items)

        if all_fulfilled:
            sales_order.status = SalesOrderStatus.FULFILLED
        elif any_fulfilled:
            sales_order.status = SalesOrderStatus.PARTIALLY_FULFILLED
        elif sales_order.status not in [
            SalesOrderStatus.DRAFT,
            SalesOrderStatus.CANCELLED,
        ]:
            sales_order.status = SalesOrderStatus.CONFIRMED

        sales_order.save(update_fields=["status", "updated_at"])
        return sales_order

    @staticmethod
    @transaction.atomic
    def confirm(*, sales_order_id, user):
        so = (
            SalesOrder.objects.select_for_update()
            .select_related("warehouse")
            .prefetch_related("items__product")
            .get(pk=sales_order_id)
        )

        if so.status != SalesOrderStatus.DRAFT:
            raise ValidationError({"status": "Only draft sales orders can be confirmed."})

        items = list(so.items.all())
        if not items:
            raise ValidationError({"items": "Sales order must have at least one item."})

        for item in items:
            reserve_qty = item.quantity_remaining
            if reserve_qty <= 0:
                continue

            try:
                InventoryService.reserve_stock(
                    product_id=item.product_id,
                    warehouse_id=so.warehouse_id,
                    quantity=reserve_qty,
                    user=user,
                )
            except ValidationError as exc:
                detail = getattr(exc, "detail", {}) or {}
                quantity_error = detail.get("quantity") if isinstance(detail, dict) else None
                if isinstance(quantity_error, list):
                    quantity_error = quantity_error[0] if quantity_error else None
                raise ValidationError(
                    {
                        "stock": (
                            f"Cannot confirm {so.so_number}: insufficient stock for "
                            f"{item.product.sku} ({item.product.name}) at "
                            f"{so.warehouse.name}. {quantity_error or 'Receive stock first.'}"
                        )
                    }
                ) from exc

            item.quantity_reserved += reserve_qty
            item.updated_by = user
            item.save(update_fields=["quantity_reserved", "updated_at", "updated_by"])

        so.status = SalesOrderStatus.CONFIRMED
        so.updated_by = user
        so.save(update_fields=["status", "updated_at", "updated_by"])

        ActivityService.log(
            action="CONFIRM",
            module="orders",
            entity_type="SalesOrder",
            entity_id=so.id,
            entity_label=so.so_number,
            description=f"Confirmed sales order {so.so_number}",
            user=user,
        )

        return so

    @staticmethod
    @transaction.atomic
    def cancel(*, sales_order_id, user):
        so = SalesOrder.objects.select_for_update().prefetch_related("items").get(
            pk=sales_order_id
        )

        if so.status == SalesOrderStatus.CANCELLED:
            raise ValidationError({"status": "Sales order is already cancelled."})

        if so.status == SalesOrderStatus.FULFILLED:
            raise ValidationError({"status": "Cannot cancel a fulfilled sales order."})

        for item in so.items.all():
            if item.quantity_reserved > 0:
                InventoryService.release_reservation(
                    product_id=item.product_id,
                    warehouse_id=so.warehouse_id,
                    quantity=item.quantity_reserved,
                    user=user,
                )
                item.quantity_reserved = Decimal("0")
                item.updated_by = user
                item.save(update_fields=["quantity_reserved", "updated_at", "updated_by"])

        so.status = SalesOrderStatus.CANCELLED
        so.updated_by = user
        so.save(update_fields=["status", "updated_at", "updated_by"])

        ActivityService.log(
            action="CANCEL",
            module="orders",
            entity_type="SalesOrder",
            entity_id=so.id,
            entity_label=so.so_number,
            description=f"Cancelled sales order {so.so_number}",
            user=user,
        )

        return so

    @staticmethod
    @transaction.atomic
    def fulfill_item(*, item_id, quantity, user):
        quantity = Decimal(str(quantity))
        if quantity <= 0:
            raise ValidationError({"quantity": "Quantity must be greater than zero."})

        item = (
            SalesOrderItem.objects.select_for_update()
            .select_related("sales_order", "product")
            .get(pk=item_id)
        )
        so = item.sales_order

        if so.status not in [
            SalesOrderStatus.CONFIRMED,
            SalesOrderStatus.PARTIALLY_FULFILLED,
        ]:
            raise ValidationError(
                {"status": "Items can only be fulfilled for confirmed sales orders."}
            )

        if quantity > item.quantity_remaining:
            raise ValidationError(
                {
                    "quantity": (
                        f"Cannot fulfill more than remaining quantity "
                        f"({item.quantity_remaining})."
                    )
                }
            )

        if quantity > item.quantity_reserved:
            raise ValidationError(
                {
                    "quantity": (
                        f"Insufficient reserved stock ({item.quantity_reserved}). "
                        "Confirm the order first."
                    )
                }
            )

        InventoryService.issue_reserved_stock(
            product_id=item.product_id,
            warehouse_id=so.warehouse_id,
            quantity=quantity,
            user=user,
            reference_number=so.so_number,
            notes=f"SO fulfillment for {item.product.sku}",
        )

        item.quantity_fulfilled += quantity
        item.quantity_reserved -= quantity
        item.updated_by = user
        item.save(
            update_fields=[
                "quantity_fulfilled",
                "quantity_reserved",
                "updated_at",
                "updated_by",
            ]
        )

        SalesOrderService._refresh_so_status(so)

        ActivityService.log(
            action="FULFILL",
            module="orders",
            entity_type="SalesOrder",
            entity_id=so.id,
            entity_label=so.so_number,
            description=f"Fulfilled {quantity} of {item.product.sku} for {so.so_number}",
            user=user,
            metadata={"product_sku": item.product.sku, "quantity": str(quantity)},
        )

        return item
