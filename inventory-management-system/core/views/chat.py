from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.api_response import ApiResponse
from core.services.chat_service import get_chat_reply


class ChatView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Chat"],
        summary="Landing page chatbot",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "history": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "role": {"type": "string"},
                                "content": {"type": "string"},
                            },
                        },
                    },
                },
                "required": ["message"],
            }
        },
    )
    def post(self, request):
        message = request.data.get("message", "")
        history = request.data.get("history") or []

        if not isinstance(history, list):
            history = []

        result = get_chat_reply(message=str(message), history=history)
        return ApiResponse.success(
            message="Reply generated.",
            data=result,
        )
