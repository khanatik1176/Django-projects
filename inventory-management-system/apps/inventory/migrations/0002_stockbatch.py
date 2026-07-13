import decimal

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0005_product_is_perishable_shelf_life_days"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("inventory", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="StockBatch",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("batch_number", models.CharField(blank=True, default="", max_length=80)),
                (
                    "quantity",
                    models.DecimalField(
                        decimal_places=2,
                        default=decimal.Decimal("0"),
                        max_digits=12,
                    ),
                ),
                ("expiry_date", models.DateField(blank=True, null=True)),
                ("received_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_deleted",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="stock_batches",
                        to="products.product",
                    ),
                ),
                (
                    "stock",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="batches",
                        to="inventory.stock",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(class)s_updated",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "warehouse",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="stock_batches",
                        to="inventory.warehouse",
                    ),
                ),
            ],
            options={
                "verbose_name": "Stock Batch",
                "verbose_name_plural": "Stock Batches",
                "db_table": "inventory_stock_batch",
                "ordering": ["expiry_date", "received_at"],
            },
        ),
    ]
