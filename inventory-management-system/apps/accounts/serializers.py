from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password

from apps.accounts.models_role import Role


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_code = serializers.CharField(source="role.code", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "profile_picture",
            "role",
            "role_name",
            "role_code",
            "account_status",
            "can_manage_config",
            "can_manage_inventory",
            "can_manage_orders",
            "can_view_reports",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "role_name",
            "role_code",
            "account_status",
            "can_manage_config",
            "can_manage_inventory",
            "can_manage_orders",
            "can_view_reports",
            "created_at",
        ]

    can_manage_config = serializers.BooleanField(read_only=True)
    can_manage_inventory = serializers.BooleanField(read_only=True)
    can_manage_orders = serializers.BooleanField(read_only=True)
    can_view_reports = serializers.BooleanField(read_only=True)


class AdminUserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    role_code = serializers.CharField(source="role.code", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "profile_picture",
            "role",
            "role_name",
            "role_code",
            "account_status",
            "is_active",
            "is_staff",
            "created_at",
        ]
        read_only_fields = ["id", "role_name", "role_code", "created_at"]


class RoleSerializer(serializers.ModelSerializer):
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            "id",
            "name",
            "code",
            "description",
            "can_manage_users",
            "can_manage_config",
            "can_manage_inventory",
            "can_manage_orders",
            "can_view_reports",
            "is_system",
            "user_count",
            "created_at",
        ]
        read_only_fields = ["id", "is_system", "user_count", "created_at"]

    def get_user_count(self, obj):
        return obj.users.count()


class RoleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = [
            "name",
            "code",
            "description",
            "can_manage_users",
            "can_manage_config",
            "can_manage_inventory",
            "can_manage_orders",
            "can_view_reports",
        ]

    def validate_code(self, value):
        return value.upper().strip()


class AdminUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    role_id = serializers.IntegerField(required=False, allow_null=True)
    approved = serializers.BooleanField(default=True)


class AdminUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False, max_length=100)
    last_name = serializers.CharField(required=False, max_length=100)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    role_id = serializers.IntegerField(required=False, allow_null=True)


class UserRegistrationSerializer(serializers.ModelSerializer):
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "password",
            "confirm_password",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"password_error": "Passwords do not match."}
            )
        return attrs
    
    

class UserLoginSerializer(serializers.Serializer):
    
    email = serializers.EmailField()
    
    password = serializers.CharField(write_only=True)
    

class UserLogoutSerializer(serializers.Serializer):
    
    refresh = serializers.CharField()
    
    def validate(self, attrs):
        
        refresh_token = attrs.get("refresh")
        
        try:
            RefreshToken(refresh_token)
            
        except Exception:
            raise serializers.ValidationError("Invalid refresh token.")
        
        return attrs
    

class UserProfileUpdateSerializer(serializers.ModelSerializer):

    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "profile_picture"]

    def validate_phone(self, value):
        if value and len(value) < 11:
            raise serializers.ValidationError("Phone number must be 11 digits long.")
        
        return value
    
    def validate_profile_picture(self, image):
        if not image:
            return image
        
        max_size = 2 * 1024 * 1024 # 2MB
        
        if image.size > max_size:
            raise serializers.ValidationError("Image size must be less than 2MB.")
        
        allowed_extensions = (".jpg", ".jpeg", ".png", ".gif", ".webp")
        
        if not image.name.lower().endswith(allowed_extensions):
            raise serializers.ValidationError("Invalid image format. Allowed formats are: JPG, JPEG, PNG, GIF, WEBP.")
        
        return image


class UserProfileUpdateRequestSerializer(serializers.Serializer):
    """OpenAPI-only serializer so Swagger shows a file upload for profile_picture."""

    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    profile_picture = serializers.ImageField(required=False)
    

class ChangePasswordSerializer(serializers.Serializer):
    
    old_password = serializers.CharField(write_only=True)
    
    new_password = serializers.CharField(write_only=True)
    
    confirm_password= serializers.CharField(write_only=True)
    
    def validate_new_password(self, value):
        
        validate_password(value)
        
        return value
    
    def validate(self, attrs):
        
        if attrs["new_password"] != attrs["confirm_password"]:
            
            raise serializers.ValidationError(
                {
                    "confirm_password": "Passwords do not match."
                }
            )
        
        return attrs


class PasswordOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    reset_token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

