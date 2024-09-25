from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.http import JsonResponse
from django.urls import reverse
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, MyTokenObtainPairSerializer
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import CustomUser
from .models import StickyNote
from .serializers import StickyNoteSerializer

class TestProtectedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"message": "You have accessed a protected view!"})

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = UserSerializer

class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(request, email=email, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return JsonResponse({'detail': 'Successfully logged out'})

class PasswordResetRequestView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User with this email does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

        token = default_token_generator.make_token(user)
        reset_url = f"http://localhost:3000/password-reset-confirm/{user.id}/{token}"
        
        subject = 'Password Reset Request'
        message = f'''
        You've requested to reset your password. Please use the following link to reset your password:

        {reset_url}

        If you didn't request this, you can safely ignore this email.

        This link will expire in 24 hours.
        '''
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
            return Response({'detail': 'Password reset email has been sent.'})
        except Exception as e:
            print(f"Error sending email: {e}")  # For debugging
            return Response({'detail': 'Failed to send password reset email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, user_id, token):
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'detail': 'New password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Password has been reset successfully.'})
    
class StickyNoteView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            notes = StickyNote.objects.filter(user=request.user)
            serializer = StickyNoteSerializer(notes, many=True)
            return Response(serializer.data)
        return Response([])  # Return empty list for anonymous users

    def post(self, request):
        serializer = StickyNoteSerializer(data=request.data)
        if serializer.is_valid():
            if request.user.is_authenticated:
                serializer.save(user=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                # For anonymous users, don't save to database, just return the validated data
                return Response(serializer.validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StickyNoteListCreateView(generics.ListCreateAPIView):
    serializer_class = StickyNoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return StickyNote.objects.filter(user=self.request.user)
        return StickyNote.objects.none()

    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)

class StickyNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StickyNoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return StickyNote.objects.filter(user=self.request.user)
        return StickyNote.objects.none()