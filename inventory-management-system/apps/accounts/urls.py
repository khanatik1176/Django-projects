from django.urls import path
from rest_framework_simplejwt.views import (TokenRefreshView)
from .views import UserRegistrationAPIView, UserLoginAPIView, UserListAPIView, UserLogoutAPIView, CurrentUserAPIView, ChangePasswordAPIView

urlpatterns = [
    path("register/", UserRegistrationAPIView.as_view(), name="register"),
    path("login/", UserLoginAPIView.as_view(), name="login"),
    path("logout/", UserLogoutAPIView.as_view(), name="logout"),
    
    path("change-password/", ChangePasswordAPIView.as_view(), name="change-password"),
    path("current-user/", CurrentUserAPIView.as_view(), name="current-user"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("list/", UserListAPIView.as_view(), name="list"),
    
    
    
]