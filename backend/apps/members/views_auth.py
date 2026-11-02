from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Member
from .serializers import SignupSerializer, LoginSerializer, MemberSerializer


class SignupView(APIView):
    """User registration endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                member = serializer.save()
                
                return Response({
                    'message': 'Account created successfully. Please login.',
                    'user': {
                        'id': str(member.id),
                        'email': member.email,
                        'first_name': member.first_name,
                        'last_name': member.last_name,
                        'role': member.role
                    }
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                return Response(
                    {'detail': f'Error creating account: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            # Find user by email
            member = Member.objects(email=email.lower()).first()
            
            if not member:
                return Response(
                    {'detail': 'Invalid email or password'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Check password
            if not member.check_password(password):
                return Response(
                    {'detail': 'Invalid email or password'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            # Generate JWT tokens
            refresh = RefreshToken()
            refresh['user_id'] = str(member.id)
            refresh['email'] = member.email
            refresh['role'] = member.role
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': str(member.id),
                    'email': member.email,
                    'first_name': member.first_name,
                    'last_name': member.last_name,
                    'role': member.role,
                    'full_name': member.full_name(),
                    'date_of_joining': member.date_of_joining.isoformat() if member.date_of_joining else None
                }
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Login error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MeView(APIView):
    """Get current user profile"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Extract user_id from JWT token
            user_id = request.auth.get('user_id') if request.auth else None
            
            if not user_id:
                return Response(
                    {'detail': 'Invalid token'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            member = Member.objects(id=user_id).first()
            
            if not member:
                return Response(
                    {'detail': 'User not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            return Response({
                'id': str(member.id),
                'email': member.email,
                'first_name': member.first_name,
                'last_name': member.last_name,
                'role': member.role,
                'full_name': member.full_name(),
                'date_of_joining': member.date_of_joining.isoformat() if member.date_of_joining else None
            })
            
        except Exception as e:
            return Response(
                {'detail': f'Error fetching profile: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )