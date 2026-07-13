import django.db.models.deletion
from decimal import Decimal

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Customer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150)),
                ("phone", models.CharField(blank=True, db_index=True, max_length=20)),
                ("address", models.TextField(blank=True)),
                ("credit_balance", models.DecimalField(decimal_places=2, default=Decimal("0"), help_text="Amount the customer currently owes the shop.", max_digits=12)),
                ("credit_limit", models.DecimalField(decimal_places=2, default=Decimal("5000"), max_digits=12)),
                ("is_active", models.BooleanField(default=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "customers",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="CreditTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("transaction_type", models.CharField(choices=[("SALE", "Credit sale"), ("PAYMENT", "Payment received"), ("ADJUSTMENT", "Adjustment")], max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("balance_after", models.DecimalField(decimal_places=2, max_digits=12)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("customer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transactions", to="orders.customer")),
                ("sales_order", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="credit_transactions", to="orders.salesorder")),
            ],
            options={
                "db_table": "credit_transactions",
                "ordering": ["-created_at"],
            },
        ),
    ]
