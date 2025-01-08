from django.urls import path
from .views import RegisterView, LoginView, LogoutView, ProtectedView, DefaultUsersView, SigninView, SignupView,
from .views import VerifyEmailView, SearchUsernameView, IsUsernameTakenView
urlpatterns = [
    path('', DefaultUsersView.as_view(), name='default_users'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('signin/', SigninView.as_view(), name='signin'),
    path('signup/', SignupView.as_view(), name='signup'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('search-username/', SearchUsernameView.as_view(), name='search_username'),
    # IsUsernameTakenView path
    path('is-username-taken/', IsUsernameTakenView.as_view(), name='is_username_taken'),, ProtectedView.as_view(), name='protected'),


]
