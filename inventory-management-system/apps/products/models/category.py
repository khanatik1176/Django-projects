from django.db import models

from core.models.audit import AuditModel

class Category(AuditModel):
    
    """
    Represents a product category
    """
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = "product_categories"
        ordering = ["name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        
    
    def __str__(self):
        return self.name
    
    