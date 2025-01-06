from django.urls import path
from .views import RegisterView, LoginView, LogoutView, ProtectedView, DefaultUsersView

urlpatterns = [
    path('', DefaultUsersView.as_view(), name='default_users'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('protected/', ProtectedView.as_view(), name='protected'),
]
