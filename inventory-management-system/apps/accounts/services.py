from django.conf import settings
from django.core.mail import send_mail
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AccountStatus, EmailOTP, Role, User


class AuthenticationService:

    @staticmethod
    def register(*, email, password, first_name, last_name, phone):
        from apps.accounts.user_management import UserManagementService

        UserManagementService.ensure_default_roles()
        viewer_role = Role.objects.filter(code="VIEWER").first()

        return User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=viewer_role,
            account_status=AccountStatus.PENDING,
            is_active=False,
        )

    @staticmethod
    def login(email, password):
        email = email.lower().strip()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("Invalid email or password.")

        if not user.check_password(password):
            raise AuthenticationFailed("Invalid email or password.")

        if user.account_status == AccountStatus.PENDING:
            raise AuthenticationFailed(
                "Your account is pending admin approval. You will be able to sign in once approved."
            )

        if user.account_status == AccountStatus.BANNED or not user.is_active:
            raise AuthenticationFailed(
                "Your account has been banned. Please contact your administrator."
            )

        refresh = RefreshToken.for_user(user)

        return {
            "user": user,
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh),
        }

    @staticmethod
    def list_users():
        return User.objects.all().order_by("-created_at")

    @staticmethod
    def logout(refresh_token):
        token = RefreshToken(refresh_token)
        token.blacklist()

    @staticmethod
    def get_current_user(user):
        return user

    @staticmethod
    def update_profile(user, validated_data):
        for field, value in validated_data.items():
            setattr(user, field, value)
        user.save()
        return user

    @staticmethod
    def request_password_otp(*, email):
        email = email.lower().strip()
        user = User.objects.filter(email=email, is_active=True).first()

        # Always respond generically to avoid email enumeration, but only send if user exists.
        if not user:
            return {
                "email": email,
                "sent": False,
                "message": "If this email is registered, a verification code has been sent.",
            }

        otp = EmailOTP.create_for_email(email)
        subject = "Bhandar password reset code"
        body = (
            f"Your Bhandar verification code is: {otp.code}\n\n"
            f"This code expires in 10 minutes.\n"
            f"If you did not request this, you can ignore this email."
        )

        send_mail(
            subject=subject,
            message=body,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bhandar.bd"),
            recipient_list=[email],
            fail_silently=False,
        )

        payload = {
            "email": email,
            "sent": True,
            "message": "Verification code sent to your email.",
            "expires_in_minutes": 10,
        }

        # Helpful for local development without a real SMTP inbox.
        if settings.DEBUG:
            payload["debug_otp"] = otp.code

        return payload

    @staticmethod
    def verify_password_otp(*, email, code):
        email = email.lower().strip()
        otp = (
            EmailOTP.objects.filter(
                email=email,
                purpose=EmailOTP.Purpose.PASSWORD_RESET,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp or otp.code != code:
            raise ValidationError({"code": "Invalid verification code."})

        if otp.is_expired:
            raise ValidationError({"code": "Verification code has expired."})

        reset_token = otp.mark_verified()

        return {
            "email": email,
            "reset_token": reset_token,
            "message": "Email verified successfully. You can set a new password.",
        }

    @staticmethod
    def confirm_password_reset(*, email, reset_token, new_password):
        email = email.lower().strip()

        try:
            otp = EmailOTP.objects.get(
                email=email,
                reset_token=reset_token,
                purpose=EmailOTP.Purpose.PASSWORD_RESET,
                is_verified=True,
                is_used=False,
            )
        except EmailOTP.DoesNotExist:
            raise ValidationError(
                {"reset_token": "Invalid or expired reset session. Request a new code."}
            )

        if otp.is_expired:
            raise ValidationError({"reset_token": "Reset session has expired."})

        user = User.objects.filter(email=email, is_active=True).first()
        if not user:
            raise ValidationError({"email": "User account not found."})

        user.set_password(new_password)
        user.save(update_fields=["password"])

        otp.is_used = True
        otp.save(update_fields=["is_used"])

        return user
