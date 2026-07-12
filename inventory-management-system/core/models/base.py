from django.db import models
from django.utils import timezone
from .base import SoftDeleteManager, SoftDeleteQuerySet

class SoftDeleteModel(models.Model):
    
    objects = SoftDeleteManager()
    
    all_objects = models.Manager()
    
    is_deleted = models.BooleanField(default=False)
    
    deleted_at = models.DateTimeField(null=True, blank=True,)
    
    class Meta:
        
        abstract = True
    
    def soft_delete(self):
        
        self.is_deleted = True
        self.deleted_at = timezone.now()
        
        self.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
            ]
        )
        
    def restore(self):
        
        self.is_deleted = False
        self.deleted_at = None
        
        self.save(
            update_fields=[
                "is_deleted",
                "deleted_at",
            ]
        )

class SoftDeleteQuerySet(models.QuerySet):
    
    def delete(self):
        
        return self.update( is_deleted=True, deleted_at=timezone.now() )
    
    def hard_delete(self):
        
        return super().delete()
    
    def alive(self):
        
        return self.filter( is_deleted=False )
    
    def deleted(self):
        
        return self.filter( is_deleted=True)
    

class SoftDeleteManager(models.Manager):
    
    def get_queryset(self):
        
        return super().get_queryset().filter( is_deleted=False )

    