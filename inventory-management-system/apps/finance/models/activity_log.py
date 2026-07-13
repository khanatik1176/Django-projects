from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    """Immutable audit trail for shop operations."""

    action = models.CharField(max_length=40, db_index=True)
    module = models.CharField(max_length=40, db_index=True)
    entity_type = models.CharField(max_length=60)
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    entity_label = models.CharField(max_length=200, blank=True)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    user_email = models.CharField(max_length=254, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.module}.{self.action} — {self.entity_label or self.entity_type}"
