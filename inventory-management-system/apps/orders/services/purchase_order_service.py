from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.inventory.services import InventoryService
from apps.finance.services import ActivityService

from apps.orders.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderStatus,
)


class PurchaseOrderService:

    @staticmethod
    def _generate_po_number():
        today = timezone.localdate().strftime("%Y%m%d")
        prefix = f"PO-{today}-"
        last = (
            PurchaseOrder.all_objects.filter(po_number__startswith=prefix)
            .order_by("-po_number")
            .first()
        )
        if last:
            seq = int(last.po_number.split("-")[-1]) + 1
        else:
            seq = 1
        return f"{prefix}{seq:04d}"

    @staticmethod
    def _refresh_po_status(purchase_order):
        items = list(purchase_order.items.all())
        if not items:
            return purchase_order

        all_received = all(item.is_fully_received for item in items)
        any_received = any(item.quantity_received > 0 for item in items)

        if all_received:
            purchase_order.status = PurchaseOrderStatus.RECEIVED
        elif any_received:
            purchase_order.status = PurchaseOrderStatus.PARTIALLY_RECEIVED
        elif purchase_order.status not in [
            PurchaseOrderStatus.DRAFT,
            PurchaseOrderStatus.CANCELLED,
        ]:
            purchase_order.status = PurchaseOrderStatus.SUBMITTED

        purchase_order.save(update_fields=["status", "updated_at"])
        return purchase_order

    @staticmethod
    @transaction.atomic
    def submit(*, purchase_order_id, user):
        po = PurchaseOrder.objects.select_for_update().prefetch_related("items").get(
            pk=purchase_order_id
        )

        if po.status != PurchaseOrderStatus.DRAFT:
            raise ValidationError({"status": "Only draft purchase orders can be submitted."})

        if not po.items.exists():
            raise ValidationError({"items": "Purchase order must have at least one item."})

        po.status = PurchaseOrderStatus.SUBMITTED
        po.updated_by = user
        po.save(update_fields=["status", "updated_at", "updated_by"])

        ActivityService.log(
            action="SUBMIT",
            module="orders",
            entity_type="PurchaseOrder",
            entity_id=po.id,
            entity_label=po.po_number,
            description=f"Submitted purchase order {po.po_number}",
            user=user,
        )

        return po

    @staticmethod
    @transaction.atomic
    def cancel(*, purchase_order_id, user):
        po = PurchaseOrder.objects.select_for_update().get(pk=purchase_order_id)

        if po.status in [PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED]:
            raise ValidationError(
                {"status": f"Cannot cancel a {po.status.lower()} purchase order."}
            )

        if po.total_received > 0:
            raise ValidationError(
                {"status": "Cannot cancel a purchase order that has received stock."}
            )

        po.status = PurchaseOrderStatus.CANCELLED
        po.updated_by = user
        po.save(update_fields=["status", "updated_at", "updated_by"])

        ActivityService.log(
            action="CANCEL",
            module="orders",
            entity_type="PurchaseOrder",
            entity_id=po.id,
            entity_label=po.po_number,
            description=f"Cancelled purchase order {po.po_number}",
            user=user,
        )

        return po

    @staticmethod
    @transaction.atomic
    def receive_item(*, item_id, quantity, user):
        quantity = Decimal(str(quantity))
        if quantity <= 0:
            raise ValidationError({"quantity": "Quantity must be greater than zero."})

        item = (
            PurchaseOrderItem.objects.select_for_update()
            .select_related("purchase_order", "product")
            .get(pk=item_id)
        )
        po = item.purchase_order

        if po.status not in [
            PurchaseOrderStatus.SUBMITTED,
            PurchaseOrderStatus.PARTIALLY_RECEIVED,
        ]:
            raise ValidationError(
                {"status": "Stock can only be received for submitted purchase orders."}
            )

        if quantity > item.quantity_remaining:
            raise ValidationError(
                {
                    "quantity": (
                        f"Cannot receive more than remaining quantity "
                        f"({item.quantity_remaining})."
                    )
                }
            )

        InventoryService.receive_stock(
            product_id=item.product_id,
            warehouse_id=po.warehouse_id,
            quantity=quantity,
            user=user,
            reference_number=po.po_number,
            notes=f"PO receipt for {item.product.sku}",
        )

        item.quantity_received += quantity
        item.updated_by = user
        item.save(update_fields=["quantity_received", "updated_at", "updated_by"])

        if item.unit_cost > 0 and item.product.cost_price != item.unit_cost:
            item.product.cost_price = item.unit_cost
            item.product.save(update_fields=["cost_price", "updated_at"])

        PurchaseOrderService._refresh_po_status(po)

        ActivityService.log(
            action="RECEIVE",
            module="orders",
            entity_type="PurchaseOrder",
            entity_id=po.id,
            entity_label=po.po_number,
            description=f"Received {quantity} of {item.product.sku} for {po.po_number}",
            user=user,
            metadata={"product_sku": item.product.sku, "quantity": str(quantity)},
        )

        return item
