from django.db import models

from core.models.audit import AuditModel

class Brand(AuditModel):
    
    """
    Represents a product brand
    """
    
    name = models.CharField(max_length=100, unique=True,)
    description = models.TextField(blank=True)
    is_active= models.BooleanField(default=True)
    
    class Meta: 
        dn_table = "product_brands"
        ordering = ["name"]
        verbose_name = "Brand"
        verbose_name_plural = "Brands"
        
    def __str__(self):
        return self.name
    
    