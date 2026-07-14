from decimal import Decimal

from django.conf import settings
from django.db import models


class MembershipTier(models.Model):
    """Customer loyalty tier — Silver, Gold, Loyal, Platinum, or custom."""

    name = models.CharField(max_length=80)
    code = models.SlugField(max_length=40, unique=True)
    description = models.TextField(blank=True)
    discount_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Automatic % discount on POS sales for members of this tier.",
    )
    points_per_hundred = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("1"),
        help_text="Loyalty points earned per ৳100 spent.",
    )
    min_points = models.PositiveIntegerField(
        default=0,
        help_text="Minimum lifetime points to qualify / auto-upgrade into this tier.",
    )
    credit_limit_bonus = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Extra udhar limit granted with this membership.",
    )
    color = models.CharField(max_length=20, default="#0b6e4f")
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_system = models.BooleanField(
        default=False,
        help_text="Built-in tiers (Silver/Gold/Loyal/Platinum) cannot be deleted.",
    )
    is_active = models.BooleanField(default=True)
    benefits = models.TextField(
        blank=True,
        help_text="Human-readable benefits list for the membership card.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "membership_tiers"
        ordering = ["sort_order", "min_points", "name"]

    def __str__(self):
        return self.name


class LoyaltyOffer(models.Model):
    """Discount or reward redeemable with points or exclusive to a membership."""

    class OfferType(models.TextChoices):
        PERCENT_OFF = "PERCENT_OFF", "Percent off"
        FIXED_OFF = "FIXED_OFF", "Fixed amount off"
        BONUS_POINTS = "BONUS_POINTS", "Bonus points"
        FREEBIE = "FREEBIE", "Free item / perk"

    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    offer_type = models.CharField(
        max_length=20,
        choices=OfferType.choices,
        default=OfferType.PERCENT_OFF,
    )
    value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0"),
        help_text="Percent, taka amount, or bonus points depending on offer type.",
    )
    points_cost = models.PositiveIntegerField(
        default=0,
        help_text="Points required to redeem. 0 = auto / membership perk (no redeem).",
    )
    membership = models.ForeignKey(
        MembershipTier,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="offers",
        help_text="Restrict to one membership. Empty = all members.",
    )
    min_points_balance = models.PositiveIntegerField(
        default=0,
        help_text="Customer must hold at least this many points to see the offer.",
    )
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "loyalty_offers"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class PointsLedgerType(models.TextChoices):
    EARN = "EARN", "Earned from purchase"
    REDEEM = "REDEEM", "Redeemed for offer"
    BONUS = "BONUS", "Bonus / promotion"
    ADJUST = "ADJUST", "Manual adjustment"
    UPGRADE = "UPGRADE", "Membership upgrade gift"


class PointsLedger(models.Model):
    customer = models.ForeignKey(
        "orders.Customer",
        on_delete=models.CASCADE,
        related_name="points_ledger",
    )
    entry_type = models.CharField(max_length=20, choices=PointsLedgerType.choices)
    points = models.IntegerField(help_text="Signed: positive earn, negative redeem.")
    balance_after = models.IntegerField()
    sales_order = models.ForeignKey(
        "orders.SalesOrder",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="points_entries",
    )
    offer = models.ForeignKey(
        LoyaltyOffer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="redemptions",
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "points_ledger"
        ordering = ["-created_at"]
