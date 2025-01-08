from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from django.contrib.auth import authenticate
from .serializers import UserSerializer

from rest_framework.response import Response
from rest_framework.views import APIView

class DefaultUsersView(APIView):
    """
    Default view for /api/users/
    """
    def get(self, request):
        return Response({
            "message": "Welcome to the Users API!",
            "endpoints": {
                "register": "/api/users/register/",
                "login": "/api/users/login/",
                "logout": "/api/users/logout/",
                "protected": "/api/users/protected/",
            }
        })


class RegisterView(APIView):
    """
    Endpoint to register a new user.
    """
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate a token for the newly registered user
            token = Token.objects.create(user=user)
            return Response({'token': token.key}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    Endpoint to log in an existing user.
    """
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            # Generate or retrieve an existing token
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Endpoint to log out the current user by invalidating the token.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Delete the token, effectively logging out the user
        request.auth.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProtectedView(APIView):
    """
    Example of a protected endpoint. Requires token authentication.
    """
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'message': 'This is a protected view!'}, status=200)





# SigninView 

import json
from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from user.models import User
from user_management.JWTManager import UserRefreshJWTManager


from django.conf import settings

class SigninView(View):
    def post(self, request):
        # Parse JSON request
        try:
            data = json.loads(request.body.decode('utf-8'))
        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON format'}, status=400)

        # Extract login details
        email = data.get('email')
        password = data.get('password')

        # Validate input
        if not email or len(email) > settings.EMAIL_MAX_LENGTH:
            return JsonResponse({'message': f'Email is required and must be less than {settings.EMAIL_MAX_LENGTH} characters'}, status=400)
        
        if not password or len(password) < settings.PASSWORD_MIN_LENGTH or len(password) > settings.PASSWORD_MAX_LENGTH:
            return JsonResponse({
                'message': f'Password must be between {settings.PASSWORD_MIN_LENGTH} and {settings.PASSWORD_MAX_LENGTH} characters'
            }, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({'message': 'User not found'}, status=404)

        if not check_password(password, user.password):
            return JsonResponse({'message': 'Invalid password'}, status=401)

        if not user.email_verified:
            return JsonResponse({'message': 'Email not verified'}, status=403)

        jwt_manager = UserRefreshJWTManager()
        jwt = jwt_manager.create_jwt(user)

        return JsonResponse({'jwt': jwt}, status=200)

    @staticmethod
    def get_user(email):
        """
        Retrieves a user by email or username.
        """
        try:
            # First try fetching by email
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            try:
                # Fall back to username lookup
                user = User.objects.get(username=email)
            except User.DoesNotExist:
                return None, 'User not found'
        except Exception as e:
            return None, str(e)
        return user, None
    

import json
from django.contrib.auth.hashers import make_password
from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.core.mail import send_mail
from user.models import User

@method_decorator(csrf_exempt, name='dispatch')
class SignupView(View):
    def post(self, request):
        try:
            data = json.loads(request.body.decode('utf-8'))
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
        except json.JSONDecodeError:
            return JsonResponse({'message': 'Invalid JSON format'}, status=400)

        # Validate inputs
        if not username or not email or not password:
            return JsonResponse({'message': 'Username, email, and password are required'}, status=400)

        if len(username) < 2 or len(username) > 20:
            return JsonResponse({'message': 'Username must be between 2 and 20 characters'}, status=400)

        if len(password) < 8 or len(password) > 100:
            return JsonResponse({'message': 'Password must be between 8 and 100 characters'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'message': 'Username is already taken'}, status=400)

        if User.objects.filter(email=email).exists():
            return JsonResponse({'message': 'Email is already registered'}, status=400)

        # Create the user
        try:
            user = User.objects.create(
                username=username,
                email=email,
                password=make_password(password),
                email_verified=False,
            )
            user.save()

            # Send verification email
            self.send_verification_email(user)

        except Exception as e:
            return JsonResponse({'message': f'Error creating user: {e}'}, status=500)

        return JsonResponse({'message': 'User registered successfully. Please verify your email to activate your account.'}, status=201)

    def send_verification_email(self, user):
        verification_url = f"http://localhost:8000/api/users/verify-email/?token={user.email_verification_token}"
        subject = "Verify your email"
        message = f"Hi {user.username},\n\nPlease click the link below to verify your email:\n\n{verification_url}\n\nThank you!"
        send_mail(
            subject,
            message,
            'your-email@example.com',  # Replace with your email
            [user.email],
            fail_silently=False,
        )


from django.http import JsonResponse
from django.views import View
from user.models import User

class VerifyEmailView(View):
    def get(self, request):
        token = request.GET.get('token')

        if not token:
            return JsonResponse({'message': 'Verification token is required'}, status=400)

        try:
            user = User.objects.get(email_verification_token=token)
            if user.email_verified:
                return JsonResponse({'message': 'Email is already verified'}, status=400)

            # Verify the email
            user.email_verified = True
            user.email_verification_token = None  # Clear the token
            user.save()

            return JsonResponse({'message': 'Email verified successfully'}, status=200)
        except User.DoesNotExist:
            return JsonResponse({'message': 'Invalid or expired token'}, status=400)



from django.http import JsonResponse
from django.views import View
from user.models import User
from django.conf import settings


class SearchUsernameView(View):
    def get(self, request):
        """
        Search for users by username with optional pagination.
        Query Parameters:
          - q: Search term (required)
          - page: Page number (optional, default=1)
          - limit: Results per page (optional, default=10, max=settings.MAX_USERNAME_SEARCH_RESULTS)
        """
        query = request.GET.get('q', '').strip()
        page = request.GET.get('page', 1)
        limit = request.GET.get('limit', settings.MAX_USERNAME_SEARCH_RESULTS)

        if not query:
            return JsonResponse({'error': 'Query parameter "q" is required'}, status=400)

        try:
            page = int(page)
            limit = min(int(limit), settings.MAX_USERNAME_SEARCH_RESULTS)  # Cap at MAX_USERNAME_SEARCH_RESULTS
        except ValueError:
            return JsonResponse({'error': 'Page and limit must be integers'}, status=400)

        if page < 1 or limit < 1:
            return JsonResponse({'error': 'Page and limit must be greater than 0'}, status=400)

        matching_users = User.objects.filter(username__icontains=query)
        total_results = matching_users.count()
        start = (page - 1) * limit
        end = start + limit
        results = matching_users[start:end]

        response = {
            'query': query,
            'total_results': total_results,
            'page': page,
            'limit': limit,
            'users': list(results.values('username')),
        }

        return JsonResponse(response, status=200)



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
from django.core.mail import EmailMessage
import csv
from io import StringIO
import logging
from django_ratelimit.decorators import ratelimit

logger = logging.getLogger(__name__)

class UserDataExportView(APIView):
    authentication_classes = [JSONWebTokenAuthentication]

    def get_user_profile_csv(self, user):
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Username', 'Email', 'Date Joined', 'Last Login'])
        writer.writerow([user.username, user.email, user.date_joined, user.last_login])
        return output.getvalue()

    def get_oauth_connections_csv(self, user):
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Provider', 'Connected Date', 'Last Used'])
        oauth_connections = getattr(user, 'oauth_connections', None)
        if oauth_connections:
            for oauth in oauth_connections.all():
                writer.writerow([oauth.provider, oauth.created_at, oauth.last_used])
        return output.getvalue()

    def get_user_statistics_csv(self, user):
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Metric', 'Value'])
        stats = getattr(user, 'statistics', {}).get('get_summary', lambda: {})()
        for key, value in stats.items():
            writer.writerow([key, value])
        return output.getvalue()

    def send_export_email(self, user, csvs):
        email = EmailMessage(
            subject='Your Account Data Export',
            body=f'Hi {user.username},\n\nAttached are your exported account data files.',
            to=[user.email],
        )

        for name, content in csvs.items():
            email.attach(f'{name}.csv', content, 'text/csv')

        try:
            email.send()
            logger.info(f'Export email sent to {user.email}')
        except Exception as e:
            logger.error(f'Error sending export email to {user.email}: {e}')
            raise

    @ratelimit(key='user', rate='5/m', block=True)
    def get(self, request):
        try:
            user = request.user  # JWT ensures the user is authenticated

            csvs = {
                'profile': self.get_user_profile_csv(user),
                'oauth_connections': self.get_oauth_connections_csv(user),
                'statistics': self.get_user_statistics_csv(user)
            }

            self.send_export_email(user, csvs)

            return Response({'message': 'Data export has been sent to your email'}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f'Data export failed: {e}')
            return Response({'error': f'Export failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_jwt.settings import api_settings
from django.contrib.auth import get_user_model
from django_ratelimit.decorators import ratelimit
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
User = get_user_model()
jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER

class RefreshJWT(APIView):
    permission_classes = []

    def validate_token(self, token):
        from rest_framework_jwt.serializers import VerifyJSONWebTokenSerializer
        try:
            data = {'token': token}
            valid_data = VerifyJSONWebTokenSerializer().validate(data)
            return valid_data['user']
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return None

    def is_token_blacklisted(self, token):
        # Implement token blacklist logic here
        return False

    @ratelimit(key='ip', rate='5/m', block=True)
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response(
                    {'error': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if self.is_token_blacklisted(refresh_token):
                return Response(
                    {'error': 'Token is blacklisted'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user = self.validate_token(refresh_token)
            if not user:
                return Response(
                    {'error': 'Invalid refresh token'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not user.is_active or getattr(user, 'account_deleted', False):
                return Response(
                    {'error': 'User account is inactive or deleted'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Generate a new access token
            payload = jwt_payload_handler(user)
            access_token = jwt_encode_handler(payload)

            # Update user's last login or activity
            user.last_login = datetime.now()
            if hasattr(user, 'update_latest_activity'):
                user.update_latest_activity()
            user.save(update_fields=['last_login'])

            logger.info(f"Token refreshed for user: {user.id}")
            return Response({
                'access_token': access_token,
                'user_id': user.id
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Token refresh failed: {str(e)}")
            return Response(
                {'error': 'Token refresh failed'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django_ratelimit.decorators import ratelimit
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class IsUsernameTakenView(APIView):
    permission_classes = []

    @ratelimit(key='ip', rate='10/m', block=True)
    def get(self, request):
        try:
            username = request.GET.get('username', '').strip().lower()
            
            if not username:
                return Response({'error': 'Username required'}, status=status.HTTP_400_BAD_REQUEST)
                
            if len(username) < 3:
                return Response({'error': 'Username too short'}, status=status.HTTP_400_BAD_REQUEST)
                
            if len(username) > 30:
                return Response({'error': 'Username too long'}, status=status.HTTP_400_BAD_REQUEST)

            is_taken = User.objects.filter(username__iexact=username).exists()
            return Response({'taken': is_taken})

        except Exception as e:
            logger.error(f'Username check failed: {e}')
            return Response({'error': 'Check failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from django_ratelimit.decorators import ratelimit
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class IsEmailTakenView(APIView):
    permission_classes = []
    email_validator = EmailValidator()

    @ratelimit(key='ip', rate='10/m', block=True)
    def get(self, request):
        try:
            email = request.GET.get('email', '').strip().lower()
            
            if not email:
                return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                self.email_validator(email)
            except:
                return Response({'error': 'Invalid email'}, status=status.HTTP_400_BAD_REQUEST)

            is_taken = User.objects.filter(email__iexact=email).exists()
            return Response({'taken': is_taken})

        except Exception as e:
            logger.error(f'Email check failed: {e}')
            return Response({'error': 'Check failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)