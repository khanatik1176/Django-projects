from django.urls import path

from core.views.chat import ChatView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
]
