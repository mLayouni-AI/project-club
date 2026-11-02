
from django.urls import path
from .views import MemberListCreate, MemberDetail
from .views_auth import SignupView, LoginView, MeView

urlpatterns = [
    # Authentication endpoints
    path('auth/signup/', SignupView.as_view(), name='auth_signup'),
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/me/', MeView.as_view(), name='auth_me'),
    
    # Member CRUD endpoints
    path('', MemberListCreate.as_view(), name='members_list_create'),
    path('<str:pk>/', MemberDetail.as_view(), name='member_detail'),
]
