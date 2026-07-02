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
        
    message = "Request Failed! "
        
    if isinstance(response.data, dict):
            
        if "detail" in response.data:
                message = response.data["detail"]
                
        elif "non_field_errors" in response.data:
                message = response.data["non_field_errors"][0]
            
        else:
                message = "Validation failed."
            
    return ApiResponse.error(message=message, errors=response.data, status_code=response.status_code)