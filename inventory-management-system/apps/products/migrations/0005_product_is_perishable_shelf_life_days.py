from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("products", "0004_product_cost_price_product_selling_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_perishable",
            field=models.BooleanField(
                default=False,
                help_text="Track expiry dates for this product (milk, yogurt, bread, etc.).",
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="shelf_life_days",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Default shelf life in days when receiving without an expiry date.",
                null=True,
            ),
        ),
    ]
