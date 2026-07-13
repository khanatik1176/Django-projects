from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from core.api_response import ApiResponse

def custom_exception_handler(exc, context):
    
    response = exception_handler(exc, context)
    
    if response is None:
        
        return ApiResponse.error(
            message="Internal Server Error",
            errors=None,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
    message = "Request failed."

    if isinstance(response.data, dict):
        if "detail" in response.data:
            message = response.data["detail"]
        elif "non_field_errors" in response.data:
            errors = response.data["non_field_errors"]
            message = errors[0] if isinstance(errors, list) and errors else errors
        else:
            # Prefer the first field error so clients see the real reason
            # (e.g. insufficient stock) instead of a generic message.
            for value in response.data.values():
                if isinstance(value, list) and value:
                    message = str(value[0])
                    break
                if isinstance(value, str):
                    message = value
                    break
            else:
                message = "Validation failed."

    return ApiResponse.error(
        message=str(message),
        errors=response.data,
        status_code=response.status_code,
    )