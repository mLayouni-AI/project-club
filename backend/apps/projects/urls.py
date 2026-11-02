
from django.urls import path
from .views import ProjectListCreate, ProjectDetail

urlpatterns = [
    path('', ProjectListCreate.as_view(), name='projects_list_create'),
    path('<str:pk>/', ProjectDetail.as_view(), name='project_detail'),
]
