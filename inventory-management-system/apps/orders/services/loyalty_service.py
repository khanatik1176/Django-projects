from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.orders.models import (
    Customer,
    LoyaltyOffer,
    MembershipTier,
    PointsLedger,
    PointsLedgerType,
)


class LoyaltyService:
    """Membership discounts, point earnings, redemptions, and auto-upgrades."""

    @staticmethod
    def membership_discount_percent(customer: Customer | None) -> Decimal:
        if not customer or not customer.membership_id:
            return Decimal("0")
        tier = customer.membership
        if not tier or not tier.is_active:
            return Decimal("0")
        return Decimal(str(tier.discount_percent or 0))

    @staticmethod
    def apply_discount(subtotal: Decimal, discount_percent: Decimal) -> tuple[Decimal, Decimal]:
        """Return (discount_amount, payable_total)."""
        subtotal = Decimal(str(subtotal))
        discount_percent = max(Decimal("0"), Decimal(str(discount_percent)))
        if discount_percent <= 0:
            return Decimal("0"), subtotal
        discount = (subtotal * discount_percent / Decimal("100")).quantize(Decimal("0.01"))
        return discount, max(Decimal("0"), subtotal - discount)

    @staticmethod
    @transaction.atomic
    def award_purchase_points(*, customer_id, amount_spent, sales_order_id=None, user=None):
        customer = Customer.objects.select_for_update().select_related("membership").get(
            pk=customer_id
        )
        if not customer.membership_id or not customer.membership.is_active:
            return None

        rate = Decimal(str(customer.membership.points_per_hundred or 0))
        if rate <= 0:
            return None

        spent = Decimal(str(amount_spent))
        if spent <= 0:
            return None

        earned = int((spent / Decimal("100") * rate).quantize(Decimal("1")))
        if earned <= 0:
            return None

        customer.loyalty_points += earned
        customer.lifetime_points += earned
        customer.save(update_fields=["loyalty_points", "lifetime_points", "updated_at"])

        entry = PointsLedger.objects.create(
            customer=customer,
            entry_type=PointsLedgerType.EARN,
            points=earned,
            balance_after=customer.loyalty_points,
            sales_order_id=sales_order_id,
            notes=f"Earned from purchase ৳{spent}",
            created_by=user,
        )

        LoyaltyService.maybe_auto_upgrade(customer=customer, user=user)
        return entry

    @staticmethod
    @transaction.atomic
    def redeem_offer(*, customer_id, offer_id, user=None, sales_order_id=None):
        customer = Customer.objects.select_for_update().select_related("membership").get(
            pk=customer_id
        )
        offer = LoyaltyOffer.objects.select_related("membership").get(pk=offer_id)

        if not offer.is_active:
            raise ValidationError({"offer_id": "This offer is not active."})

        now = timezone.now()
        if offer.starts_at and now < offer.starts_at:
            raise ValidationError({"offer_id": "This offer has not started yet."})
        if offer.ends_at and now > offer.ends_at:
            raise ValidationError({"offer_id": "This offer has expired."})

        if offer.membership_id and customer.membership_id != offer.membership_id:
            raise ValidationError(
                {"offer_id": "This offer is exclusive to another membership."}
            )

        if customer.loyalty_points < offer.min_points_balance:
            raise ValidationError(
                {
                    "offer_id": (
                        f"Need at least {offer.min_points_balance} points to use this offer."
                    )
                }
            )

        cost = int(offer.points_cost or 0)
        if cost > 0 and customer.loyalty_points < cost:
            raise ValidationError(
                {"offer_id": f"Not enough points. Need {cost}, have {customer.loyalty_points}."}
            )

        if cost > 0:
            customer.loyalty_points -= cost
            customer.save(update_fields=["loyalty_points", "updated_at"])
            PointsLedger.objects.create(
                customer=customer,
                entry_type=PointsLedgerType.REDEEM,
                points=-cost,
                balance_after=customer.loyalty_points,
                sales_order_id=sales_order_id,
                offer=offer,
                notes=f"Redeemed offer: {offer.title}",
                created_by=user,
            )

        return {
            "offer": offer,
            "customer": customer,
            "points_spent": cost,
        }

    @staticmethod
    def offer_checkout_discount(offer: LoyaltyOffer, subtotal: Decimal) -> Decimal:
        subtotal = Decimal(str(subtotal))
        value = Decimal(str(offer.value or 0))
        if offer.offer_type == LoyaltyOffer.OfferType.PERCENT_OFF:
            return (subtotal * value / Decimal("100")).quantize(Decimal("0.01"))
        if offer.offer_type == LoyaltyOffer.OfferType.FIXED_OFF:
            return min(subtotal, value).quantize(Decimal("0.01"))
        return Decimal("0")

    @staticmethod
    @transaction.atomic
    def maybe_auto_upgrade(*, customer, user=None):
        """Promote to the highest active tier whose min_points <= lifetime_points."""
        tiers = list(
            MembershipTier.objects.filter(is_active=True).order_by("-min_points", "-sort_order")
        )
        if not tiers:
            return None

        eligible = next(
            (t for t in tiers if customer.lifetime_points >= t.min_points),
            None,
        )
        if not eligible:
            return None

        current_min = customer.membership.min_points if customer.membership_id else -1
        if eligible.min_points <= current_min and customer.membership_id == eligible.id:
            return None
        if customer.membership_id == eligible.id:
            return None
        # Only upgrade, never downgrade via auto path
        if customer.membership_id and eligible.min_points < current_min:
            return None

        old = customer.membership.name if customer.membership_id else "None"
        customer.membership = eligible
        if not customer.membership_joined_at:
            customer.membership_joined_at = timezone.now()
        customer.save(
            update_fields=["membership", "membership_joined_at", "updated_at"]
        )

        bonus = 50 if eligible.code == "PLATINUM" else 25 if eligible.code in ("GOLD", "LOYAL") else 10
        if bonus > 0:
            customer.loyalty_points += bonus
            customer.lifetime_points += bonus
            customer.save(update_fields=["loyalty_points", "lifetime_points", "updated_at"])
            PointsLedger.objects.create(
                customer=customer,
                entry_type=PointsLedgerType.UPGRADE,
                points=bonus,
                balance_after=customer.loyalty_points,
                notes=f"Upgraded {old} → {eligible.name} (+{bonus} bonus points)",
                created_by=user,
            )
        return eligible

    @staticmethod
    @transaction.atomic
    def assign_membership(*, customer_id, membership_id, user=None):
        customer = Customer.objects.select_for_update().get(pk=customer_id)
        if membership_id:
            tier = MembershipTier.objects.get(pk=membership_id, is_active=True)
            customer.membership = tier
            customer.membership_joined_at = timezone.now()
        else:
            customer.membership = None
            customer.membership_joined_at = None
        customer.save(
            update_fields=["membership", "membership_joined_at", "updated_at"]
        )
        return customer

    @staticmethod
    @transaction.atomic
    def adjust_points(*, customer_id, points, notes="", user=None):
        customer = Customer.objects.select_for_update().get(pk=customer_id)
        delta = int(points)
        new_balance = customer.loyalty_points + delta
        if new_balance < 0:
            raise ValidationError({"points": "Points balance cannot go below zero."})
        customer.loyalty_points = new_balance
        if delta > 0:
            customer.lifetime_points += delta
        customer.save(update_fields=["loyalty_points", "lifetime_points", "updated_at"])
        entry = PointsLedger.objects.create(
            customer=customer,
            entry_type=PointsLedgerType.ADJUST if delta != 0 else PointsLedgerType.BONUS,
            points=delta,
            balance_after=customer.loyalty_points,
            notes=notes or "Manual points adjustment",
            created_by=user,
        )
        if delta > 0:
            LoyaltyService.maybe_auto_upgrade(customer=customer, user=user)
        return entry
