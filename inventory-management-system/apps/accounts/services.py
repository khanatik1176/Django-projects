from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer
from .models import User

class AuthenticationService:
    
    @staticmethod
    def register(*, email, password, first_name, last_name, phone):
        user = User.objects.create_user(email=email, password=password, first_name=first_name, last_name=last_name, phone=phone)
        return UserSerializer(user).data
    
    @staticmethod
    def login(email, password):
        
        user = authenticate(username=email, password=password)
        
        if user is None: 
            raise AuthenticationFailed("Invalid email or password.")
        
        if not user.is_active: 
            raise AuthenticationFailed("Your account has been deactivated.")
        
        refresh = RefreshToken.for_user(user)
        
        return {
            
            "user": UserSerializer(user).data,
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
        }
    
    @staticmethod
    def list_users():
        users = User.objects.all().order_by("-created_at")
        return UserSerializer(users, many=True).data
    