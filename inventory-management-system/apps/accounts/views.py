from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response 
from rest_framework.views import APIView

from drf_spectacular.utils import (extend_schema,)

from .serializers import UserRegistrationSerializer

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
        
        serializer.save()
        
        return Response(
            {
                "message": "User registered successfully",
                "data": serializer.data,
                "error":serializer.errors
            },
            
            status=status.HTTP_201_CREATED
        )