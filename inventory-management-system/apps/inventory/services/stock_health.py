from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

EXPIRY_WARNING_DAYS = 7


class StockHealthStatus:
    LOW_STOCK = "LOW_STOCK"
    ADEQUATE = "ADEQUATE"
    GOOD = "GOOD"
    EXPIRING_SOON = "EXPIRING_SOON"
    OUT_OF_STOCK = "OUT_OF_STOCK"


HEALTH_LABELS = {
    StockHealthStatus.LOW_STOCK: "Low stock",
    StockHealthStatus.ADEQUATE: "Adequate",
    StockHealthStatus.GOOD: "Good",
    StockHealthStatus.EXPIRING_SOON: "Expiring soon",
    StockHealthStatus.OUT_OF_STOCK: "Out of stock",
}


def compute_stock_health(stock, batches=None):
    """Derive grocery-friendly stock health for a warehouse stock row."""
    quantity = stock.quantity
    reorder = stock.reorder_level or Decimal("0")

    if batches is None:
        batches = list(
            stock.batches.filter(quantity__gt=0).only(
                "quantity", "expiry_date", "batch_number"
            )
        )

    today = timezone.now().date()
    warning_date = today + timedelta(days=EXPIRY_WARNING_DAYS)

    expiring_qty = Decimal("0")
    nearest_expiry = None

    for batch in batches:
        if batch.quantity <= 0:
            continue
        if batch.expiry_date:
            if batch.expiry_date <= warning_date:
                expiring_qty += batch.quantity
            if nearest_expiry is None or batch.expiry_date < nearest_expiry:
                nearest_expiry = batch.expiry_date

    days_to_expiry = None
    if nearest_expiry:
        days_to_expiry = (nearest_expiry - today).days

    is_expiring_soon = expiring_qty > 0

    if quantity <= 0:
        status = StockHealthStatus.OUT_OF_STOCK
    elif is_expiring_soon:
        status = StockHealthStatus.EXPIRING_SOON
    elif reorder > 0 and quantity <= reorder:
        status = StockHealthStatus.LOW_STOCK
    elif reorder > 0 and quantity <= reorder * Decimal("2"):
        status = StockHealthStatus.ADEQUATE
    else:
        status = StockHealthStatus.GOOD

    return {
        "health_status": status,
        "health_label": HEALTH_LABELS[status],
        "is_expiring_soon": is_expiring_soon,
        "days_to_expiry": days_to_expiry,
        "expiring_quantity": expiring_qty,
        "nearest_expiry": nearest_expiry,
    }


def prefetch_batches_for_stocks(stocks):
    """Attach prefetched batch lists to stock instances for serializer use."""
    from apps.inventory.models import StockBatch

    stock_ids = [s.id for s in stocks]
    batch_map = {sid: [] for sid in stock_ids}
    for batch in (
        StockBatch.objects.filter(stock_id__in=stock_ids, quantity__gt=0)
        .only("stock_id", "quantity", "expiry_date", "batch_number")
        .order_by("expiry_date", "received_at")
    ):
        batch_map[batch.stock_id].append(batch)

    for stock in stocks:
        stock._health_batches = batch_map.get(stock.id, [])
    return stocks
