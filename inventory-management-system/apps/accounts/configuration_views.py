from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.pagination import CustomPagination

from apps.accounts.permissions import CanManageConfig
from apps.accounts.serializers import (
    AdminUserCreateSerializer,
    AdminUserSerializer,
    AdminUserUpdateSerializer,
    RoleCreateSerializer,
    RoleSerializer,
)
from apps.accounts.user_management import UserManagementService


class RoleListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageConfig]

    @extend_schema(tags=["Configuration"], summary="List roles")
    def get(self, request):
        roles = UserManagementService.list_roles()
        return ApiResponse.success(
            message="Roles retrieved.",
            data={"results": RoleSerializer(roles, many=True).data},
        )

    @extend_schema(tags=["Configuration"], summary="Create role", request=RoleCreateSerializer)
    def post(self, request):
        serializer = RoleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = UserManagementService.create_role(**serializer.validated_data)
        return ApiResponse.created(
            message="Role created.",
            data=RoleSerializer(role).data,
        )


class RoleDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageConfig]

    @extend_schema(tags=["Configuration"], summary="Update role", request=RoleCreateSerializer)
    def patch(self, request, pk):
        serializer = RoleCreateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        role = UserManagementService.update_role(pk, **serializer.validated_data)
        return ApiResponse.success(
            message="Role updated.",
            data=RoleSerializer(role).data,
        )

    @extend_schema(tags=["Configuration"], summary="Delete role")
    def delete(self, request, pk):
        UserManagementService.delete_role(pk)
        return ApiResponse.success(message="Role deleted.")


class AdminUserListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageConfig]
    pagination_class = CustomPagination

    @extend_schema(tags=["Configuration"], summary="List users (admin)")
    def get(self, request):
        users = UserManagementService.list_users()
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(users, request, view=self)
        data = AdminUserSerializer(page, many=True).data
        return paginator.get_paginated_response(data)

    @extend_schema(tags=["Configuration"], summary="Create user (admin)", request=AdminUserCreateSerializer)
    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserManagementService.create_user(**serializer.validated_data)
        return ApiResponse.created(
            message="User created.",
            data=AdminUserSerializer(user).data,
        )


class AdminUserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageConfig]

    @extend_schema(tags=["Configuration"], summary="Update user (admin)", request=AdminUserUpdateSerializer)
    def patch(self, request, pk):
        serializer = AdminUserUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = UserManagementService.update_user(pk, **serializer.validated_data)
        return ApiResponse.success(
            message="User updated.",
            data=AdminUserSerializer(user).data,
        )


class AdminUserApproveAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageConfig]

    @extend_schema(tags=["Configuration"], summary="Approve pending user")
    def post(self, request, pk):
        user = UserManagementService.approve_user(pk)
        return ApiResponse.success(
            message="User approved.",
            data=AdminUserSerializer(user).data,
        )


class AdminUserBanAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageConfig]

    @extend_schema(tags=["Configuration"], summary="Ban user")
    def post(self, request, pk):
        user = UserManagementService.ban_user(pk)
        return ApiResponse.success(
            message="User banned.",
            data=AdminUserSerializer(user).data,
        )


class AdminUserUnbanAPIView(APIView):
    permission_classes = [IsAuthenticated, CanManageConfig]

    @extend_schema(tags=["Configuration"], summary="Unban user")
    def post(self, request, pk):
        user = UserManagementService.unban_user(pk)
        return ApiResponse.success(
            message="User unbanned.",
            data=AdminUserSerializer(user).data,
        )
