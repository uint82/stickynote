from django.urls import path
from .views import RegisterView, LoginView, LogoutView, PasswordResetRequestView, PasswordResetConfirmView, TestProtectedView, MyTokenObtainPairView, StickyNoteView, StickyNoteListCreateView, StickyNoteDetailView
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/<int:user_id>/<str:token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('test-protected/', TestProtectedView.as_view(), name='test_protected'),
    path('sticky-notes/', StickyNoteView.as_view(), name='sticky_notes'),
    path('sticky-notes/', StickyNoteListCreateView.as_view(), name='sticky-note-list-create'),
    path('sticky-notes/<int:pk>/', StickyNoteDetailView.as_view(), name='sticky-note-detail'),
]