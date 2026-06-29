from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response 
from rest_framework.views import APIView

from drf_spectacular.utils import (extend_schema,)

from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer
from .services import AuthenticationService

@extend_schema(
    summary="User Registration",
    description="Register a new user",
    request=UserRegistrationSerializer,
    responses={201: UserRegistrationSerializer},
    auth=[],
)
class UserRegistrationAPIView(APIView):
    permission_classes= [AllowAny]
    
    def post(self, request):
        
        serializer = UserRegistrationSerializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)

        
        data = AuthenticationService.register(email=serializer.validated_data["email"], password=serializer.validated_data["password"], first_name=serializer.validated_data["first_name"], last_name=serializer.validated_data["last_name"], phone=serializer.validated_data["phone"])
        
        return Response(
            {
                "message": "User registered successfully",
                "data": data,
                "error":serializer.errors if serializer.errors else None
            },
            status=status.HTTP_201_CREATED
        )
        

@extend_schema(
    summary="User Login",
    description="Login a user",
    request=UserLoginSerializer,
    responses={200: UserLoginSerializer},
    auth=[],
)
class UserLoginAPIView(APIView):
    permission_classes= [AllowAny]
    
    def post(self, request):
        
        serializer= UserLoginSerializer(data = request.data)
        
        serializer.is_valid(raise_exception=True)
        
        data = AuthenticationService.login(email=serializer.validated_data["email"], password=serializer.validated_data["password"])
        
        return Response(
            {
                "message": "User logged in successfully",
                "data": data,
                "error":serializer.errors if serializer.errors else None
            },
            status=status.HTTP_200_OK
        )
        

@extend_schema(
    summary="List Users",
    description="Get all registered user Lists",
    responses={200: UserSerializer}
)

class UserListAPIView(APIView):
    
    permission_classes= [IsAuthenticated]
    
    def get(self, request):
        data = AuthenticationService.list_users()
        
        return Response(
            {
                "message": "Users listed successfully",
                "data": data,
                "error": None
            },
            status=status.HTTP_200_OK
        )
    
    