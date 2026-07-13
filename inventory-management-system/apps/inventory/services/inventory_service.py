from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from apps.inventory.models import (
    MovementType,
    Stock,
    StockBatch,
    StockMovement,
    StockTransfer,
    TransferStatus,
    Warehouse,
)


class InventoryService:
    """Central service for all stock mutations with transactional safety."""

    @staticmethod
    def _validate_quantity(quantity):
        quantity = Decimal(str(quantity))
        if quantity <= 0:
            raise ValidationError({"quantity": "Quantity must be greater than zero."})
        return quantity

    @staticmethod
    def _lock_stock(product, warehouse, user):
        stock, _ = Stock.objects.select_for_update().get_or_create(
            product=product,
            warehouse=warehouse,
            defaults={
                "quantity": Decimal("0"),
                "created_by": user,
                "updated_by": user,
            },
        )
        return stock

    @staticmethod
    def _create_movement(
        *,
        product,
        warehouse,
        movement_type,
        quantity,
        quantity_before,
        quantity_after,
        user,
        reference_number="",
        notes="",
        stock_transfer=None,
    ):
        return StockMovement.objects.create(
            product=product,
            warehouse=warehouse,
            movement_type=movement_type,
            quantity=quantity,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            reference_number=reference_number,
            notes=notes,
            stock_transfer=stock_transfer,
            created_by=user,
            updated_by=user,
        )

    @staticmethod
    def _deduct_batches_fefo(stock, quantity, user):
        """Deduct quantity from batches — earliest expiry first (FEFO)."""
        remaining = quantity
        batches = (
            StockBatch.objects.select_for_update()
            .filter(stock=stock, quantity__gt=0)
            .order_by("expiry_date", "received_at", "id")
        )
        for batch in batches:
            if remaining <= 0:
                break
            deduct = min(batch.quantity, remaining)
            batch.quantity -= deduct
            batch.updated_by = user
            batch.save(update_fields=["quantity", "updated_at", "updated_by"])
            remaining -= deduct

    @staticmethod
    def _create_batch(
        *,
        stock,
        product,
        warehouse,
        quantity,
        user,
        expiry_date=None,
        batch_number="",
    ):
        return StockBatch.objects.create(
            stock=stock,
            product=product,
            warehouse=warehouse,
            quantity=quantity,
            expiry_date=expiry_date,
            batch_number=batch_number or "",
            created_by=user,
            updated_by=user,
        )

    @staticmethod
    @transaction.atomic
    def receive_stock(
        *,
        product_id,
        warehouse_id,
        quantity,
        user,
        reference_number="",
        notes="",
        expiry_date=None,
        batch_number="",
    ):
        from datetime import timedelta

        quantity = InventoryService._validate_quantity(quantity)
        product = Product.objects.get(pk=product_id)
        warehouse = Warehouse.objects.get(pk=warehouse_id)

        stock = InventoryService._lock_stock(product, warehouse, user)
        quantity_before = stock.quantity
        quantity_after = quantity_before + quantity

        stock.quantity = quantity_after
        stock.updated_by = user
        stock.save(update_fields=["quantity", "updated_at", "updated_by"])

        resolved_expiry = expiry_date
        if product.is_perishable and not resolved_expiry and product.shelf_life_days:
            from django.utils import timezone

            resolved_expiry = timezone.now().date() + timedelta(
                days=product.shelf_life_days
            )

        if product.is_perishable or resolved_expiry or batch_number:
            InventoryService._create_batch(
                stock=stock,
                product=product,
                warehouse=warehouse,
                quantity=quantity,
                user=user,
                expiry_date=resolved_expiry,
                batch_number=batch_number,
            )

        movement = InventoryService._create_movement(
            product=product,
            warehouse=warehouse,
            movement_type=MovementType.RECEIPT,
            quantity=quantity,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            user=user,
            reference_number=reference_number,
            notes=notes,
        )

        from apps.finance.services import ActivityService

        ActivityService.log(
            action="STOCK_RECEIVE",
            module="inventory",
            entity_type="Stock",
            entity_id=stock.id,
            entity_label=f"{product.sku} @ {warehouse.name}",
            description=f"Received {quantity} units of {product.name}",
            user=user,
            metadata={"quantity": str(quantity), "reference": reference_number},
        )

        return stock, movement

    @staticmethod
    @transaction.atomic
    def issue_stock(
        *,
        product_id,
        warehouse_id,
        quantity,
        user,
        reference_number="",
        notes="",
    ):
        quantity = InventoryService._validate_quantity(quantity)
        product = Product.objects.get(pk=product_id)
        warehouse = Warehouse.objects.get(pk=warehouse_id)

        stock = InventoryService._lock_stock(product, warehouse, user)

        if stock.available_quantity < quantity:
            raise ValidationError(
                {
                    "quantity": (
                        f"Insufficient stock. Available: {stock.available_quantity}, "
                        f"requested: {quantity}."
                    )
                }
            )

        quantity_before = stock.quantity
        quantity_after = quantity_before - quantity

        stock.quantity = quantity_after
        stock.updated_by = user
        stock.save(update_fields=["quantity", "updated_at", "updated_by"])

        InventoryService._deduct_batches_fefo(stock, quantity, user)

        movement = InventoryService._create_movement(
            product=product,
            warehouse=warehouse,
            movement_type=MovementType.ISSUE,
            quantity=quantity,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            user=user,
            reference_number=reference_number,
            notes=notes,
        )

        from apps.finance.services import ActivityService

        ActivityService.log(
            action="STOCK_ISSUE",
            module="inventory",
            entity_type="Stock",
            entity_id=stock.id,
            entity_label=f"{product.sku} @ {warehouse.name}",
            description=f"Issued {quantity} units of {product.name}",
            user=user,
            metadata={"quantity": str(quantity), "reference": reference_number},
        )

        return stock, movement

    @staticmethod
    @transaction.atomic
    def adjust_stock(
        *,
        product_id,
        warehouse_id,
        new_quantity,
        user,
        notes="",
    ):
        new_quantity = Decimal(str(new_quantity))
        if new_quantity < 0:
            raise ValidationError({"new_quantity": "Quantity cannot be negative."})

        product = Product.objects.get(pk=product_id)
        warehouse = Warehouse.objects.get(pk=warehouse_id)

        stock = InventoryService._lock_stock(product, warehouse, user)
        quantity_before = stock.quantity

        if new_quantity < stock.reserved_quantity:
            raise ValidationError(
                {
                    "new_quantity": (
                        f"Cannot set quantity below reserved amount "
                        f"({stock.reserved_quantity})."
                    )
                }
            )

        adjustment = abs(new_quantity - quantity_before)
        if adjustment == 0:
            raise ValidationError({"new_quantity": "New quantity matches current stock."})

        stock.quantity = new_quantity
        stock.updated_by = user
        stock.save(update_fields=["quantity", "updated_at", "updated_by"])

        movement = InventoryService._create_movement(
            product=product,
            warehouse=warehouse,
            movement_type=MovementType.ADJUSTMENT,
            quantity=adjustment,
            quantity_before=quantity_before,
            quantity_after=new_quantity,
            user=user,
            notes=notes,
        )

        return stock, movement

    @staticmethod
    @transaction.atomic
    def complete_transfer(*, transfer_id, user):
        transfer = (
            StockTransfer.objects.select_for_update()
            .select_related("product", "from_warehouse", "to_warehouse")
            .get(pk=transfer_id)
        )

        if transfer.status != TransferStatus.PENDING:
            raise ValidationError(
                {"status": f"Transfer is already {transfer.status.lower()}."}
            )

        if transfer.from_warehouse_id == transfer.to_warehouse_id:
            raise ValidationError(
                {"to_warehouse": "Source and destination warehouse must differ."}
            )

        quantity = transfer.quantity

        source_stock = InventoryService._lock_stock(
            transfer.product, transfer.from_warehouse, user
        )

        if source_stock.available_quantity < quantity:
            raise ValidationError(
                {
                    "quantity": (
                        f"Insufficient stock at source warehouse. "
                        f"Available: {source_stock.available_quantity}."
                    )
                }
            )

        dest_stock = InventoryService._lock_stock(
            transfer.product, transfer.to_warehouse, user
        )

        source_before = source_stock.quantity
        source_after = source_before - quantity
        source_stock.quantity = source_after
        source_stock.updated_by = user
        source_stock.save(update_fields=["quantity", "updated_at", "updated_by"])

        dest_before = dest_stock.quantity
        dest_after = dest_before + quantity
        dest_stock.quantity = dest_after
        dest_stock.updated_by = user
        dest_stock.save(update_fields=["quantity", "updated_at", "updated_by"])

        InventoryService._create_movement(
            product=transfer.product,
            warehouse=transfer.from_warehouse,
            movement_type=MovementType.TRANSFER_OUT,
            quantity=quantity,
            quantity_before=source_before,
            quantity_after=source_after,
            user=user,
            reference_number=transfer.reference_number,
            notes=transfer.notes,
            stock_transfer=transfer,
        )

        InventoryService._create_movement(
            product=transfer.product,
            warehouse=transfer.to_warehouse,
            movement_type=MovementType.TRANSFER_IN,
            quantity=quantity,
            quantity_before=dest_before,
            quantity_after=dest_after,
            user=user,
            reference_number=transfer.reference_number,
            notes=transfer.notes,
            stock_transfer=transfer,
        )

        transfer.status = TransferStatus.COMPLETED
        transfer.updated_by = user
        transfer.save(update_fields=["status", "updated_at", "updated_by"])

        return transfer

    @staticmethod
    @transaction.atomic
    def cancel_transfer(*, transfer_id, user):
        transfer = StockTransfer.objects.select_for_update().get(pk=transfer_id)

        if transfer.status != TransferStatus.PENDING:
            raise ValidationError(
                {"status": f"Only pending transfers can be cancelled."}
            )

        transfer.status = TransferStatus.CANCELLED
        transfer.updated_by = user
        transfer.save(update_fields=["status", "updated_at", "updated_by"])

        return transfer

    @staticmethod
    @transaction.atomic
    def reserve_stock(*, product_id, warehouse_id, quantity, user):
        quantity = InventoryService._validate_quantity(quantity)
        product = Product.objects.get(pk=product_id)
        warehouse = Warehouse.objects.get(pk=warehouse_id)

        stock = InventoryService._lock_stock(product, warehouse, user)

        if stock.available_quantity < quantity:
            raise ValidationError(
                {
                    "quantity": (
                        f"Insufficient available stock to reserve. "
                        f"Available: {stock.available_quantity}, requested: {quantity}."
                    )
                }
            )

        stock.reserved_quantity += quantity
        stock.updated_by = user
        stock.save(update_fields=["reserved_quantity", "updated_at", "updated_by"])

        return stock

    @staticmethod
    @transaction.atomic
    def release_reservation(*, product_id, warehouse_id, quantity, user):
        quantity = InventoryService._validate_quantity(quantity)
        product = Product.objects.get(pk=product_id)
        warehouse = Warehouse.objects.get(pk=warehouse_id)

        stock = InventoryService._lock_stock(product, warehouse, user)

        if stock.reserved_quantity < quantity:
            raise ValidationError(
                {
                    "quantity": (
                        f"Cannot release more than reserved. "
                        f"Reserved: {stock.reserved_quantity}, requested: {quantity}."
                    )
                }
            )

        stock.reserved_quantity -= quantity
        stock.updated_by = user
        stock.save(update_fields=["reserved_quantity", "updated_at", "updated_by"])

        return stock

    @staticmethod
    @transaction.atomic
    def issue_reserved_stock(
        *,
        product_id,
        warehouse_id,
        quantity,
        user,
        reference_number="",
        notes="",
    ):
        quantity = InventoryService._validate_quantity(quantity)
        product = Product.objects.get(pk=product_id)
        warehouse = Warehouse.objects.get(pk=warehouse_id)

        stock = InventoryService._lock_stock(product, warehouse, user)

        if stock.reserved_quantity < quantity:
            raise ValidationError(
                {
                    "quantity": (
                        f"Insufficient reserved stock. "
                        f"Reserved: {stock.reserved_quantity}, requested: {quantity}."
                    )
                }
            )

        if stock.quantity < quantity:
            raise ValidationError(
                {"quantity": f"Insufficient on-hand stock ({stock.quantity})."}
            )

        quantity_before = stock.quantity
        quantity_after = quantity_before - quantity

        stock.quantity = quantity_after
        stock.reserved_quantity -= quantity
        stock.updated_by = user
        stock.save(
            update_fields=["quantity", "reserved_quantity", "updated_at", "updated_by"]
        )

        InventoryService._deduct_batches_fefo(stock, quantity, user)

        movement = InventoryService._create_movement(
            product=product,
            warehouse=warehouse,
            movement_type=MovementType.ISSUE,
            quantity=quantity,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            user=user,
            reference_number=reference_number,
            notes=notes,
        )

        return stock, movement

    @staticmethod
    @transaction.atomic
    def write_off_expired_for_stock(
        *,
        stock_id,
        user,
        notes="",
        include_expiring_soon=False,
    ):
        from datetime import timedelta

        from django.utils import timezone

        stock = (
            Stock.objects.select_for_update()
            .select_related("product", "warehouse")
            .get(pk=stock_id)
        )
        today = timezone.now().date()
        cutoff = today + timedelta(days=7) if include_expiring_soon else today

        batches = list(
            StockBatch.objects.select_for_update().filter(
                stock=stock,
                quantity__gt=0,
                expiry_date__isnull=False,
                expiry_date__lte=cutoff,
            )
        )
        total = sum((batch.quantity for batch in batches), Decimal("0"))
        if total <= 0:
            label = "expiring soon" if include_expiring_soon else "expired"
            raise ValidationError(
                {"detail": f"No {label} stock batches to write off for this item."}
            )

        if stock.quantity < total:
            raise ValidationError(
                {
                    "detail": (
                        f"Cannot write off {total} units — only {stock.quantity} on hand."
                    )
                }
            )

        for batch in batches:
            batch.quantity = Decimal("0")
            batch.updated_by = user
            batch.save(update_fields=["quantity", "updated_at", "updated_by"])

        quantity_before = stock.quantity
        quantity_after = quantity_before - total
        stock.quantity = quantity_after
        stock.updated_by = user
        stock.save(update_fields=["quantity", "updated_at", "updated_by"])

        write_off_note = notes or (
            "Expiring soon write-off" if include_expiring_soon else "Expired stock write-off"
        )
        movement = InventoryService._create_movement(
            product=stock.product,
            warehouse=stock.warehouse,
            movement_type=MovementType.ISSUE,
            quantity=total,
            quantity_before=quantity_before,
            quantity_after=quantity_after,
            user=user,
            reference_number="WRITE-OFF-EXPIRED",
            notes=write_off_note,
        )
        return stock, movement, total

    @staticmethod
    @transaction.atomic
    def manage_stock(*, stock_id, action, user, data):
        stock = Stock.objects.select_related("product", "warehouse").get(pk=stock_id)

        if action == "update_thresholds":
            if "reorder_level" in data:
                stock.reorder_level = data["reorder_level"]
            if "max_stock_level" in data:
                stock.max_stock_level = data["max_stock_level"]
            stock.updated_by = user
            stock.save(
                update_fields=["reorder_level", "max_stock_level", "updated_at", "updated_by"]
            )
            return {"stock": stock, "movement": None}

        if action == "adjust_quantity":
            stock, movement = InventoryService.adjust_stock(
                product_id=stock.product_id,
                warehouse_id=stock.warehouse_id,
                new_quantity=data["new_quantity"],
                user=user,
                notes=data.get("notes", ""),
            )
            return {"stock": stock, "movement": movement}

        if action == "write_off_expired":
            stock, movement, _ = InventoryService.write_off_expired_for_stock(
                stock_id=stock_id,
                user=user,
                notes=data.get("notes", ""),
                include_expiring_soon=data.get("include_expiring_soon", False),
            )
            return {"stock": stock, "movement": movement}

        if action == "top_up":
            stock, movement = InventoryService.receive_stock(
                product_id=stock.product_id,
                warehouse_id=stock.warehouse_id,
                quantity=data["quantity"],
                user=user,
                reference_number=data.get("reference_number", "TOP-UP"),
                notes=data.get("notes", "Shelf restock"),
                expiry_date=data.get("expiry_date"),
                batch_number=data.get("batch_number", ""),
            )
            return {"stock": stock, "movement": movement}

        raise ValidationError({"action": f"Unknown action: {action}"})

    @staticmethod
    def get_low_stock_queryset():
        from django.db.models import F

        return Stock.objects.select_related("product", "warehouse").filter(
            reorder_level__gt=0,
            quantity__lte=F("reorder_level"),
        )

    @staticmethod
    def get_expiring_batches_queryset(within_days=7):
        from datetime import timedelta

        from django.utils import timezone

        from apps.inventory.models import StockBatch

        cutoff = timezone.now().date() + timedelta(days=within_days)
        return (
            StockBatch.objects.select_related("product", "warehouse", "stock")
            .filter(quantity__gt=0, expiry_date__isnull=False, expiry_date__lte=cutoff)
            .order_by("expiry_date")
        )

    @staticmethod
    def get_health_summary():
        from apps.inventory.services.stock_health import (
            StockHealthStatus,
            compute_stock_health,
            prefetch_batches_for_stocks,
        )

        stocks = list(Stock.objects.select_related("product", "warehouse"))
        prefetch_batches_for_stocks(stocks)

        summary = {
            StockHealthStatus.LOW_STOCK: 0,
            StockHealthStatus.ADEQUATE: 0,
            StockHealthStatus.GOOD: 0,
            StockHealthStatus.EXPIRING_SOON: 0,
            StockHealthStatus.OUT_OF_STOCK: 0,
        }

        for stock in stocks:
            batches = getattr(stock, "_health_batches", [])
            health = compute_stock_health(stock, batches)
            summary[health["health_status"]] += 1

        return summary

    @staticmethod
    def get_dashboard_summary():
        from django.db.models import Sum

        stock_agg = Stock.objects.aggregate(total_units=Sum("quantity"))

        return {
            "total_warehouses": Warehouse.objects.filter(is_active=True).count(),
            "total_stock_records": Stock.objects.count(),
            "total_units_on_hand": stock_agg["total_units"] or Decimal("0"),
            "low_stock_items": InventoryService.get_low_stock_queryset().count(),
            "expiring_soon_items": InventoryService.get_expiring_batches_queryset().count(),
            "pending_transfers": StockTransfer.objects.filter(
                status=TransferStatus.PENDING
            ).count(),
            "recent_movements": StockMovement.objects.count(),
        }
