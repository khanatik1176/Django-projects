from django.db import models

from core.models.audit import AuditModel

from .category import Category
from .brand import Brand
from .supplier import Supplier

class Product(AuditModel):
    """
    Represents a product
    """    
    
    name = models.CharField(max_length=255)
    sku= models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, unique=True, blank=True, null=True)
    category =models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    brand = models.ForeignKey(Brand, on_delete=models.PROTECT, related_name="products")
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="products")
    description = models.TextField(blank=True)
    unit_of_measure = models.CharField(max_length=20, default="pcs")
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_perishable = models.BooleanField(
        default=False,
        help_text="Track expiry dates for this product (milk, yogurt, bread, etc.).",
    )
    shelf_life_days = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Default shelf life in days when receiving without an expiry date.",
    )
    is_active= models.BooleanField(default=True)
    
    class Meta:
        db_table = "products"
        ordering = ["name"]
        
    def __str__(self):
        return self.name