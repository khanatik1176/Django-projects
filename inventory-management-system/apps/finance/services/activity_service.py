from apps.finance.models import ActivityLog


class ActivityService:

    @staticmethod
    def log(
        *,
        action,
        module,
        entity_type,
        description,
        user=None,
        entity_id=None,
        entity_label="",
        metadata=None,
    ):
        return ActivityLog.objects.create(
            action=action,
            module=module,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_label=entity_label,
            description=description,
            metadata=metadata or {},
            user=user,
            user_email=getattr(user, "email", "") if user else "",
        )
