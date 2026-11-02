
from django.urls import path
from .views import EventListCreate, EventDetail

urlpatterns = [
    path('', EventListCreate.as_view(), name='events_list_create'),
    path('<str:pk>/', EventDetail.as_view(), name='event_detail'),
]
