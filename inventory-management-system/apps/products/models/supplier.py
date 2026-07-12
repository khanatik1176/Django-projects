from django.db import models

from core.models.audit import AuditModel

class Supplier(AuditModel):
    
    """
    Represents a product supplier
    """
    
    name = models.CharField(max_length=150, unique=True)
    contact_person = models.CharField(max_length=100, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    is_active= models.BooleanField(default=True)
    
    class Meta:
        db_table = "product_suppliers"
        ordering = ["name"]
        verbose_name = "Supplier"
        verbose_name_plural = "Suppliers"
        
    def __str__(self):
        return self.name
    
    