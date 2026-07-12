from rest_framework import status
from rest_framework.viewsets import ModelViewSet

from core.api_response import ApiResponse 

class BaseModelViewSet(ModelViewSet):
    """
    Base Viewset for all CRUD Modules
    """
    
    def finalize_response(self, request, response, *args, **kwargs):
        """
        Wrap successful DRF responses in our standard format.
        Leave error responses unchanged because our global 
        exception handler already formats them.
        """
        
        response = super().finalize_response(request, response, *args, **kwargs)
        
        if(hasattr(response, "data") and isinstance(response.data, dict) and response.status_code < 400 and "success" not in response.data):
            response.data = {
                "success": True,
                "message": "Operation successful",
                "data": response.data,
                "errors": None,
            }
        
        return response 
    
    def perform_create(self, serializer):
        
        """
        Automatically popilate audit fields
        """
        
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
        
    def perform_update(self, serializer):
        
        """
        Automatically update updated_by field
        """
        serializer.save(updated_by=self.request.user)
        
    def destroy(self, request, *args, **kwargs):
        """
         Perform a soft delete instead of a hard delete 
        """
        instance = self.get_object()
        instance.soft_delete()
        
        return ApiResponse.success(
            message="Deleted successfully",
        )