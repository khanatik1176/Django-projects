from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from apps.orders.models import Customer, SalesOrder, SalesOrderItem
from apps.orders.services.credit_service import CreditService
from apps.orders.services.loyalty_service import LoyaltyService
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
        redeem_offer_id=None,
    ):
        if not items:
            raise ValidationError({"items": "Cart is empty."})

        customer = None
        if customer_id:
            customer = Customer.objects.select_related("membership").get(pk=customer_id)
            customer_name = customer.name
            customer_phone = customer.phone or ""

        priced_lines = []
        subtotal = Decimal("0")
        for line in items:
            product = Product.objects.get(pk=line["product_id"])
            qty = Decimal(str(line["quantity"]))
            unit_price = Decimal(str(line.get("unit_price") or product.selling_price or 0))
            line_total = qty * unit_price
            subtotal += line_total
            priced_lines.append(
                {
                    "product": product,
                    "qty": qty,
                    "unit_price": unit_price,
                    "line_total": line_total,
                }
            )

        membership_pct = LoyaltyService.membership_discount_percent(customer)
        membership_discount, after_membership = LoyaltyService.apply_discount(
            subtotal, membership_pct
        )

        offer_discount = Decimal("0")
        offer = None
        if redeem_offer_id:
            if not customer_id:
                raise ValidationError(
                    {"redeem_offer_id": "Select a member customer to redeem an offer."}
                )
            redeemed = LoyaltyService.redeem_offer(
                customer_id=customer_id,
                offer_id=redeem_offer_id,
                user=user,
            )
            offer = redeemed["offer"]
            if offer.offer_type == offer.OfferType.BONUS_POINTS:
                bonus = int(offer.value or 0)
                if bonus > 0:
                    LoyaltyService.adjust_points(
                        customer_id=customer_id,
                        points=bonus,
                        notes=f"Bonus from offer: {offer.title}",
                        user=user,
                    )
            elif offer.offer_type != offer.OfferType.FREEBIE:
                offer_discount = LoyaltyService.offer_checkout_discount(
                    offer, after_membership
                )

        payable = max(Decimal("0"), after_membership - offer_discount)
        scale = (payable / subtotal) if subtotal > 0 else Decimal("1")

        note_bits = [f"POS · {payment_method}"]
        if membership_discount > 0:
            note_bits.append(f"member -{membership_pct}%")
        if offer:
            note_bits.append(f"offer:{offer.title}")
        if notes:
            note_bits.append(notes)

        so = SalesOrder.objects.create(
            so_number=SalesOrderService._generate_so_number(),
            customer_name=customer_name,
            customer_phone=customer_phone,
            warehouse_id=warehouse_id,
            notes=" · ".join(note_bits),
            created_by=user,
            updated_by=user,
        )

        for line in priced_lines:
            adjusted_unit = (line["unit_price"] * scale).quantize(Decimal("0.01"))
            SalesOrderItem.objects.create(
                sales_order=so,
                product=line["product"],
                quantity_ordered=line["qty"],
                unit_price=adjusted_unit,
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
        final_total = so.total_revenue

        if payment_method == "CREDIT":
            if not customer_id:
                raise ValidationError(
                    {"customer_id": "Select a customer for udhar (credit) sales."}
                )
            CreditService.record_sale(
                customer_id=customer_id,
                amount=final_total,
                sales_order_id=so.id,
                user=user,
                notes=notes,
            )
            FinanceService.record_sale_income(
                amount=final_total,
                payment_method=PaymentMethod.CREDIT,
                sales_order_id=so.id,
                user=user,
                description=f"POS udhar sale {so.so_number}",
                customer_id=customer_id,
            )
        else:
            FinanceService.record_sale_income(
                amount=final_total,
                payment_method=payment_method,
                sales_order_id=so.id,
                user=user,
                description=f"POS sale {so.so_number}",
            )

        points_earned = 0
        if customer_id:
            entry = LoyaltyService.award_purchase_points(
                customer_id=customer_id,
                amount_spent=final_total,
                sales_order_id=so.id,
                user=user,
            )
            if entry:
                points_earned = entry.points

        ActivityService.log(
            action="POS_CHECKOUT",
            module="inventory",
            entity_type="SalesOrder",
            entity_id=so.id,
            entity_label=so.so_number,
            description=f"POS checkout {final_total} BDT via {payment_method}",
            user=user,
            metadata={
                "payment_method": payment_method,
                "total": str(final_total),
                "subtotal": str(subtotal),
                "membership_discount": str(membership_discount),
                "offer_discount": str(offer_discount),
                "item_count": len(items),
                "points_earned": points_earned,
                "customer_id": customer_id,
            },
        )

        return {
            "sales_order": so,
            "total": final_total,
            "subtotal": subtotal,
            "membership_discount": membership_discount,
            "offer_discount": offer_discount,
            "payment_method": payment_method,
            "item_count": len(items),
            "points_earned": points_earned,
        }
