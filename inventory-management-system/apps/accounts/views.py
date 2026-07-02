from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from .serializers import (
    ChangePasswordSerializer,
    UserLoginSerializer,
    UserLogoutSerializer,
    UserProfileUpdateRequestSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)
from .services import AuthenticationService
from core.api_response import ApiResponse

def _get_profile_update_data(request):
    data = request.data.copy()
    if data.get("profile_picture") in ("", None):
        data.pop("profile_picture", None)
    return data


@extend_schema(
    summary="User Registration",
    description="Register a new user",
    request=UserRegistrationSerializer,
    responses={201: UserRegistrationSerializer},
    auth=[],
)
class UserRegistrationAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = AuthenticationService.register(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
            first_name=serializer.validated_data["first_name"],
            last_name=serializer.validated_data["last_name"],
            phone=serializer.validated_data["phone"],
        )

        user_data = UserSerializer(result).data

        return ApiResponse.created(
            message="User registered successfully",
            data={
                "user": user_data,
            },
        )


@extend_schema(
    summary="User Login",
    description="Login a user",
    request=UserLoginSerializer,
    responses={200: UserLoginSerializer},
    auth=[],
)
class UserLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = AuthenticationService.login(
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        user_data = UserSerializer(result["user"]).data

        return ApiResponse.success(
            message="User logged in successfully",
            data={
                "user": user_data,
                "access_token": result["access_token"],
                "refresh_token": result["refresh_token"],
            },
            errors=serializer.errors if serializer.errors else None,
        )


@extend_schema(
    summary="List Users",
    description="Get all registered user Lists",
    responses={200: UserSerializer},
)
class UserListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        result = AuthenticationService.list_users()
        users_data = UserSerializer(result, many=True).data

        return ApiResponse.success(
            message="Users listed successfully",
            data={
                "users": users_data,
            },
            errors=None,
        )


@extend_schema(
    summary="User Logout",
    description="Logout a user",
    request=UserLogoutSerializer,
    responses={200: UserLogoutSerializer},
)
class UserLogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserLogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        AuthenticationService.logout(serializer.validated_data["refresh"])

        return ApiResponse.success(
            message="User logged out successfully",
            data=None,
            errors=None,
        )


@extend_schema(
    methods=["GET"],
    summary="Get Current User",
    description="Get the current authenticated user",
    responses={200: UserSerializer},
)
@extend_schema(
    methods=["PUT", "PATCH"],
    summary="Update Current User",
    description="Update the current user. Use multipart/form-data when uploading a profile picture.",
    request={
        "multipart/form-data": UserProfileUpdateRequestSerializer,
    },
    responses={200: UserSerializer},
)
class CurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user)

        return ApiResponse.success(
            message="Current user retrieved successfully",
            data={
                "user": serializer.data,
            },
            errors=None,
        )

    def put(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=_get_profile_update_data(request),
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return ApiResponse.success(
            message="Current user updated successfully",
            data={
                "user": UserSerializer(serializer.instance).data,
            },
            errors=None,
        )

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=_get_profile_update_data(request),
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return ApiResponse.success(
            message="Current user updated successfully",
            data={
                "user": UserSerializer(serializer.instance).data,
            },
            errors=None,
        )

@extend_schema(
    summary="Change Password",
    description="Change the current user's password",
    request=ChangePasswordSerializer,
    responses={200: ChangePasswordSerializer},
)

class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request):
        
        serializer = ChangePasswordSerializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        
        AuthenticationService.change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"]
        )
        
        return ApiResponse.success(
            
            message="Password changed successfully",
            data=None,
            errors=None,
        )