from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken



User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "phone", "profile_picture"]


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
