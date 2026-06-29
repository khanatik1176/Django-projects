from django.urls import path

from .views import UserRegistrationAPIView, UserLoginAPIView, UserListAPIView, UserLogoutAPIView, CurrentUserAPIView

urlpatterns = [
    path("register/", UserRegistrationAPIView.as_view(), name="register"),
    path("login/", UserLoginAPIView.as_view(), name="login"),
    path("logout/", UserLogoutAPIView.as_view(), name="logout"),
    
    path("current-user/", CurrentUserAPIView.as_view(), name="current-user"),
    
    path("list/", UserListAPIView.as_view(), name="list"),
    
]