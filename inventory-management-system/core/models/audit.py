from django.conf import settings
from django.db import models 
from .soft_delete import SoftDeleteModel


class AuditModel(SoftDeleteModel):
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_created_by",
    )
    
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_updated_by",
    )
    
    class Meta:
        
        abstract = True
        
        