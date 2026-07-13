from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from apps.orders.models import Customer, SalesOrder, SalesOrderItem
from apps.orders.services.credit_service import CreditService
from apps.orders.services.sales_order_service import SalesOrderService
from apps.finance.models import PaymentMethod
from apps.finance.services import ActivityService, FinanceService


class POSService:
    """Fast counter checkout for walk-in grocery sales."""

    @staticmethod
    @transaction.atomic
    def checkout(
        *,
        warehouse_id,
        items,
        user,
        customer_name="Walk-in Customer",
        customer_phone="",
        payment_method="CASH",
        customer_id=None,
        notes="",
    ):
        if not items:
            raise ValidationError({"items": "Cart is empty."})

        if customer_id:
            customer = Customer.objects.get(pk=customer_id)
            customer_name = customer.name
            customer_phone = customer.phone or ""

        so = SalesOrder.objects.create(
            so_number=SalesOrderService._generate_so_number(),
            customer_name=customer_name,
            customer_phone=customer_phone,
            warehouse_id=warehouse_id,
            notes=f"POS · {payment_method}" + (f" · {notes}" if notes else ""),
            created_by=user,
            updated_by=user,
        )

        total = Decimal("0")
        for line in items:
            product = Product.objects.get(pk=line["product_id"])
            qty = Decimal(str(line["quantity"]))
            unit_price = Decimal(str(line.get("unit_price") or product.selling_price or 0))
            total += qty * unit_price

            SalesOrderItem.objects.create(
                sales_order=so,
                product=product,
                quantity_ordered=qty,
                unit_price=unit_price,
                created_by=user,
                updated_by=user,
            )

        SalesOrderService.confirm(sales_order_id=so.id, user=user)

        for item in list(so.items.all()):
            remaining = item.quantity_remaining
            if remaining > 0:
                SalesOrderService.fulfill_item(
                    item_id=item.id,
                    quantity=remaining,
                    user=user,
                )

        so.refresh_from_db()

        if payment_method == "CREDIT":
            if not customer_id:
                raise ValidationError(
                    {"customer_id": "Select a customer for udhar (credit) sales."}
                )
            CreditService.record_sale(
                customer_id=customer_id,
                amount=so.total_revenue,
                sales_order_id=so.id,
                user=user,
                notes=notes,
            )
            FinanceService.record_sale_income(
                amount=so.total_revenue,
                payment_method=PaymentMethod.CREDIT,
                sales_order_id=so.id,
                user=user,
                description=f"POS udhar sale {so.so_number}",
                customer_id=customer_id,
            )
        else:
            FinanceService.record_sale_income(
                amount=so.total_revenue,
                payment_method=payment_method,
                sales_order_id=so.id,
                user=user,
                description=f"POS sale {so.so_number}",
            )

        ActivityService.log(
            action="POS_CHECKOUT",
            module="inventory",
            entity_type="SalesOrder",
            entity_id=so.id,
            entity_label=so.so_number,
            description=f"POS checkout {so.total_revenue} BDT via {payment_method}",
            user=user,
            metadata={
                "payment_method": payment_method,
                "total": str(so.total_revenue),
                "item_count": len(items),
            },
        )

        return {
            "sales_order": so,
            "total": so.total_revenue,
            "payment_method": payment_method,
            "item_count": len(items),
        }
