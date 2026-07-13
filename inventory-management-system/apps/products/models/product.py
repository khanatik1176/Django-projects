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
    is_active= models.BooleanField(default=True)
    
    class Meta:
        db_table = "products"
        ordering = ["name"]
        
    def __str__(self):
        return self.name