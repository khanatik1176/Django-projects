from rest_framework import serializers

from apps.inventory.models import Warehouse


class WarehouseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Warehouse
        fields = [
            "id",
            "name",
            "code",
            "address",
            "contact_person",
            "phone",
            "is_default",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
