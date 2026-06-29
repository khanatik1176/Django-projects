from decimal import ExtendedContext
from pydoc import describe
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response 
from rest_framework.views import APIView

from drf_spectacular.utils import (extend_schema,)

from .serializers import UserProfileUpdateSerializer, UserRegistrationSerializer, UserLoginSerializer, UserSerializer, UserLogoutSerializer, UserProfileUpdateSerializer

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

        
        result = AuthenticationService.register(email=serializer.validated_data["email"], password=serializer.validated_data["password"], first_name=serializer.validated_data["first_name"], last_name=serializer.validated_data["last_name"], phone=serializer.validated_data["phone"])
        
        user_data = UserSerializer(result).data
        
        return Response(
            {
                "message": "User registered successfully",
                "data": {
                    "user": user_data,
                },
                "error": None
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
        
        result = AuthenticationService.login(email=serializer.validated_data["email"], password=serializer.validated_data["password"])
        
        user_data = UserSerializer(result["user"]).data
        
        return Response(
            {
                "message": "User logged in successfully",
                "data": {
                    "user": user_data,
                    "access_token": result["access_token"],
                    "refresh_token": result["refresh_token"],
                },
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
        result = AuthenticationService.list_users()
        
        users_data = UserSerializer(result, many=True).data
        
        return Response(
            {
                "message": "Users listed successfully",
                "data": {
                    "users": users_data,
                },
                "error": None
            },
            status=status.HTTP_200_OK
        )

@extend_schema(
    summary="User Logout",
    description="Logout a user",
    request=UserLogoutSerializer,
    responses={200: UserLogoutSerializer},
)

class UserLogoutAPIView(APIView):
    
    permission_classes= [IsAuthenticated]
    
    def post(self, request):
        
        serializer = UserLogoutSerializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        
        AuthenticationService.logout(serializer.validated_data["refresh"])
        
        return Response(
            {
                "message": "User logged out successfully",
                "data": None,
                "error": None
            },
            status=status.HTTP_200_OK
        )
        
@extend_schema(
    summary="Get Current User",
    description="Get or update the current user",
    request=UserProfileUpdateSerializer,
    responses={200: UserSerializer},
    methods=["GET", "PUT", "PATCH"],
)

class CurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        
        serializer= UserSerializer(request.user)
        
        return Response(
            {
                "message": "Current user retrieved successfully",
                "data": {
                    "user": serializer.data,
                },
                "error": None
            },
            status=status.HTTP_200_OK
        )
        
    def put(self, request):
        
        serializer= UserProfileUpdateSerializer(request.user, data=request.data)
        
        serializer.is_valid(raise_exception=True)
        
        user = AuthenticationService.update_profile(request.user, serializer.validated_data)
        
        return Response(
            {
                "message": "Current user updated successfully",
                "data": {
                    "user": UserSerializer(user).data,
                },
                "error": None
            },
            status=status.HTTP_200_OK
        ) 
        
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        
        serializer.is_valid(raise_exception=True)
        
        user = AuthenticationService.update_profile(request.user, serializer.validated_data)
        
        return Response(
            {
                "message": "Current user updated successfully",
                "data": {
                    "user": UserSerializer(user).data,
                },
                "error": None
            },
            status=status.HTTP_200_OK
        ) 
