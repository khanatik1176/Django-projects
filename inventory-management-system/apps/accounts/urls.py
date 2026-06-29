from django.urls import path

from .views import UserRegistrationAPIView, UserLoginAPIView, UserListAPIView

urlpatterns = [
    path("register/", UserRegistrationAPIView.as_view(), name="register"),
    path("login/", UserLoginAPIView.as_view(), name="login"),
    path("list/", UserListAPIView.as_view(), name="list"),
]