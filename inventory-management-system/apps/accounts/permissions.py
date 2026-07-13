from rest_framework.permissions import BasePermission


class CanManageConfig(BasePermission):
    """Admin / configuration managers only."""

    message = "You do not have permission to manage configuration."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.can_manage_config)
        )


class CanManageInventory(BasePermission):
    """Warehouse staff and managers who can mutate stock."""

    message = "You do not have permission to manage inventory."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.can_manage_inventory)


class CanManageOrders(BasePermission):
    """Users who can create and process purchase/sales orders."""

    message = "You do not have permission to manage orders."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return bool(user.role and user.role.can_manage_orders)


class CanViewReports(BasePermission):
    """Read-only report and finance access."""

    message = "You do not have permission to view reports."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.can_manage_config:
            return True
        return bool(user.role and user.role.can_view_reports)


class CanUpdateStockList(BasePermission):
    """Shop owner (admin) and operations manager can update stock levels."""

    message = "Only admin or manager can update stock records."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user.can_manage_config:
            return True
        code = user.role.code if user.role else None
        return code in ("ADMIN", "MANAGER")
