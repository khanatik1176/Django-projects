from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CurrentUserAPIView,
    PasswordOTPRequestAPIView,
    PasswordOTPVerifyAPIView,
    PasswordResetConfirmAPIView,
    UserListAPIView,
    UserLoginAPIView,
    UserLogoutAPIView,
    UserRegistrationAPIView,
)

from .configuration_views import (
    AdminUserApproveAPIView,
    AdminUserBanAPIView,
    AdminUserDetailAPIView,
    AdminUserListCreateAPIView,
    AdminUserUnbanAPIView,
    RoleDetailAPIView,
    RoleListCreateAPIView,
)

urlpatterns = [
    path("register/", UserRegistrationAPIView.as_view(), name="register"),
    path("login/", UserLoginAPIView.as_view(), name="login"),
    path("logout/", UserLogoutAPIView.as_view(), name="logout"),
    path("current-user/", CurrentUserAPIView.as_view(), name="current-user"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("list/", UserListAPIView.as_view(), name="list"),
    path(
        "password/request-otp/",
        PasswordOTPRequestAPIView.as_view(),
        name="password-request-otp",
    ),
    path(
        "password/verify-otp/",
        PasswordOTPVerifyAPIView.as_view(),
        name="password-verify-otp",
    ),
    path(
        "password/confirm/",
        PasswordResetConfirmAPIView.as_view(),
        name="password-confirm",
    ),
    path("roles/", RoleListCreateAPIView.as_view(), name="roles"),
    path("roles/<int:pk>/", RoleDetailAPIView.as_view(), name="role-detail"),
    path("users/", AdminUserListCreateAPIView.as_view(), name="admin-users"),
    path("users/<int:pk>/", AdminUserDetailAPIView.as_view(), name="admin-user-detail"),
    path("users/<int:pk>/approve/", AdminUserApproveAPIView.as_view(), name="admin-user-approve"),
    path("users/<int:pk>/ban/", AdminUserBanAPIView.as_view(), name="admin-user-ban"),
    path("users/<int:pk>/unban/", AdminUserUnbanAPIView.as_view(), name="admin-user-unban"),
]
