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



import json
from django.http import JsonResponse
from django.views import View
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from common.src.jwt_managers import user_authentication
from user.models import User


@method_decorator(user_authentication(['POST']), name='dispatch')
@method_decorator(csrf_exempt, name='dispatch')
class SearchUsernameView(View):
    """
    Search for users by username using POST.
    Query Parameters:
        - username: The search term (required).
        - page: Page number (optional, default=1).
        - limit: Results per page (optional, default=settings.MAX_USERNAME_SEARCH_RESULTS).
    """

    def post(self, request):
        try:
            # Parse JSON request body
            json_request = json.loads(request.body.decode('utf-8'))
            search_query = json_request.get('username', '').strip()
            page = json_request.get('page', 1)
            limit = json_request.get('limit', settings.MAX_USERNAME_SEARCH_RESULTS)

            # Validate inputs
            if not search_query:
                return JsonResponse({'errors': ['Username is required']}, status=400)
            try:
                page = int(page)
                limit = min(int(limit), settings.MAX_USERNAME_SEARCH_RESULTS)  # Cap the limit
            except ValueError:
                return JsonResponse({'errors': ['Page and limit must be integers']}, status=400)

            if page < 1 or limit < 1:
                return JsonResponse({'errors': ['Page and limit must be greater than 0']}, status=400)

            # Perform the search
            matching_users = User.objects.filter(username__icontains=search_query)
            total_results = matching_users.count()
            start = (page - 1) * limit
            end = start + limit
            results = matching_users[start:end]

            # Build the response
            response = {
                'query': search_query,
                'total_results': total_results,
                'page': page,
                'limit': limit,
                'users': list(results.values('username')),
            }

            return JsonResponse(response, status=200)

        except json.JSONDecodeError:
            return JsonResponse({'errors': ['Invalid JSON format in the request body']}, status=400)
        except Exception as e:
            return JsonResponse({'errors': [f'An unexpected error occurred: {str(e)}']}, status=500)




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
        

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_jwt.authentication import JSONWebTokenAuthentication
import logging

logger = logging.getLogger(__name__)

class MeView(APIView):
    authentication_classes = [JSONWebTokenAuthentication]

    def get(self, request):
        try:
            user = request.user
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_active': user.is_active
            })
        except Exception as e:
            logger.error(f'Profile fetch failed: {e}')
            return Response({'error': 'Failed to fetch profile'}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

from datetime import datetime, timezone
from django.contrib.auth.tokens import default_token_generator
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from user.models import User
from user_management.JWTManager import UserRefreshJWTManager
from user_management.utils import post_user_stats
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class VerifyEmailView(View):
    def post(self, request, user_id, token):
        try:
            # Fetch user by ID
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({'errors': ['User not found']}, status=404)
        except Exception as e:
            logger.error(f"Error fetching user: {e}")
            return JsonResponse({'errors': ['Invalid user ID']}, status=400)

        if user.emailVerified:
            return JsonResponse({'errors': ['User already verified']}, status=400)

        # Check the token validity
        if not default_token_generator.check_token(user, token):
            return JsonResponse({'errors': ['Invalid verification token']}, status=401)

        # Check if the token has expired
        if user.emailVerificationTokenExpiration < datetime.now(timezone.utc):
            try:
                user.emailVerificationToken = None
                user.emailVerificationTokenExpiration = None
                user.save()
            except Exception as e:
                logger.error(f"Error clearing expired token: {e}")
                return JsonResponse(
                    {'errors': ['An error occurred while removing the expired token']},
                    status=500
                )
            return JsonResponse({'errors': ['Verification token expired']}, status=401)

        # Post user stats (if applicable)
        valid, errors = post_user_stats(user.id)
        if not valid:
            logger.error(f"Error posting user stats: {errors}")
            return JsonResponse({'errors': errors}, status=500)

        try:
            # Mark email as verified
            user.emailVerified = True
            user.emailVerificationToken = None
            user.emailVerificationTokenExpiration = None
            user.save()

            # Generate a refresh token
            success, refresh_token, errors = UserRefreshJWTManager.generate_jwt(user.id)
            if not success:
                return JsonResponse({'errors': errors}, status=400)

            # Update user activity
            try:
                user.update_latest_login()
                user.save()
            except Exception as e:
                logger.error(f"Error updating user login: {e}")
                return JsonResponse(
                    {'errors': [f'An error occurred: {e}']},
                    status=500
                )

            logger.info(f"User {user_id} verified successfully.")
            return JsonResponse({'message': 'User verified', 'refresh_token': refresh_token}, status=200)

        except Exception as e:
            logger.error(f"Unexpected error during verification: {e}")
            return JsonResponse({'errors': [f'An unexpected error occurred: {e}']}, status=500)


from django.http import JsonResponse, HttpRequest
from django.utils import timezone
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from common.src.jwt_managers import service_authentication
from user.models import User
from user.views.delete_account import delete_account
from user_management import settings
from user_management.JWTManager import UserAccessJWTManager
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(service_authentication(['DELETE']), name='dispatch')
class DeleteInactiveUsersView(View):
    def delete(self, request: HttpRequest) -> JsonResponse:
        try:
            # Remove inactive users
            inactive_response = self.remove_inactive_users()
            if inactive_response:
                return JsonResponse({'errors': [inactive_response]}, status=500)

            # Remove old pending accounts
            pending_response = self.remove_old_pending_accounts()
            if pending_response:
                return JsonResponse({'errors': [pending_response]}, status=500)

            return JsonResponse({'message': 'Inactive and pending users deleted successfully'}, status=200)

        except Exception as e:
            logger.error(f"Error in DeleteInactiveUsersView: {e}")
            return JsonResponse({'errors': [f"Unexpected error: {e}"]}, status=500)

    def remove_inactive_users(self):
        try:
            # Find users inactive for the configured period
            inactivity_cutoff = timezone.now() - timezone.timedelta(
                days=settings.MAX_INACTIVITY_DAYS_BEFORE_DELETION
            )
            inactive_users = User.objects.filter(last_activity__lt=inactivity_cutoff, is_active=True)

            for user in inactive_users:
                # Generate JWT for the user
                success, access_token, errors = UserAccessJWTManager.generate_jwt(user.id)
                if not success:
                    logger.error(f"Error generating JWT for user {user.id}: {errors}")
                    return f"Error generating JWT for user {user.id}: {errors}"

                # Call external delete_account function
                response = delete_account(user.id, access_token)
                if response.get('errors'):
                    logger.error(f"Error deleting user {user.id}: {response}")
                    return f"Error deleting user {user.id}: {response}"

            logger.info(f"Successfully deleted {len(inactive_users)} inactive users.")
            return None  # No errors

        except Exception as e:
            logger.error(f"Error removing inactive users: {e}")
            return f"Error removing inactive users: {e}"

    def remove_old_pending_accounts(self):
        try:
            # Find unverified accounts past their grace period
            pending_cutoff = timezone.now() - timezone.timedelta(
                days=settings.MAX_DAYS_BEFORE_PENDING_ACCOUNTS_DELETION
            )
            pending_accounts = User.objects.filter(
                emailVerified=False, account_deleted=False, date_joined__lt=pending_cutoff
            )

            # Delete users
            user_ids = list(pending_accounts.values_list('id', flat=True))
            pending_accounts.delete()
            logger.info(f"Successfully deleted {len(user_ids)} pending accounts. User IDs: {user_ids}")
            return None  # No errors

        except Exception as e:
            logger.error(f"Error removing pending accounts: {e}")
            return f"Error removing pending accounts: {e}"


from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from django_ratelimit.decorators import ratelimit
from common.src.jwt_managers import user_authentication
from user.models import User
from user_management.JWTManager import UserAccessJWTManager
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
@method_decorator(user_authentication(['DELETE']), name='dispatch')
@method_decorator(ratelimit(key='user', rate='3/h', block=True), name='dispatch')
class DeleteAccountView(View):
    """
    A view to allow users to delete their own accounts.
    Requires authentication and handles 2FA if enabled.
    Rate limited to 3 attempts per hour.
    """
    
    def validate_credentials(self, user, request):
        """Validate user credentials including password and 2FA if enabled"""
        # Verify password
        password = request.GET.get('password')
        if not password or not user.check_password(password):
            logger.warning(f"Password verification failed for user {user.id}")
            return False, JsonResponse(
                {'error': 'Password verification failed'}, 
                status=401
            )

        # Check 2FA if enabled
        if user.has_2fa:
            twofa_code = request.GET.get('2fa_code')
            if not twofa_code or not user.verify_2fa(twofa_code):
                logger.warning(f"2FA verification failed for user {user.id}")
                return False, JsonResponse(
                    {'error': '2FA verification failed'}, 
                    status=401
                )

        return True, None

    def generate_deletion_token(self, user_id):
        """Generate JWT token for account deletion"""
        success, access_token, errors = UserAccessJWTManager.generate_jwt(user_id)
        if not success:
            logger.error(f"JWT generation failed for user {user_id}: {errors}")
            return None, JsonResponse(
                {'error': 'Authorization token generation failed'}, 
                status=500
            )
        return access_token, None

    def perform_account_deletion(self, user, access_token):
        """
        Handles the actual deletion of the user account.
        Performs necessary cleanup tasks and external service notifications.
        """
        try:
            with transaction.atomic():
                # Example: Clean up user data in external services
                # self.cleanup_external_services(user.id, access_token)
                
                # Example: Archive user data if needed
                # self.archive_user_data(user)
                
                # Delete the user
                user_id = user.id
                user.delete()
                
                logger.info(f"Account successfully deleted for user {user_id}")
                return True

        except Exception as e:
            logger.error(f"Error deleting account for user {user.id}: {e}")
            return False

    def cleanup_external_services(self, user_id, access_token):
        """
        Clean up user data in external services.
        Implement API calls to external services here.
        """
        try:
            # Example: Delete user data from external service
            # response = delete_external_account(user_id, access_token)
            # if not response.get('success'):
            #     raise Exception("External service cleanup failed")
            pass
        except Exception as e:
            logger.error(f"External service cleanup failed for user {user_id}: {e}")
            raise

    def archive_user_data(self, user):
        """
        Archive user data before deletion if required.
        Implement archiving logic here.
        """
        try:
            # Example: Create user data archive
            # UserArchive.objects.create(
            #     user_id=user.id,
            #     email=user.email,
            #     username=user.username,
            #     data=self.collect_user_data(user)
            # )
            pass
        except Exception as e:
            logger.error(f"Data archiving failed for user {user.id}: {e}")
            raise

    def delete(self, request):
        """Handle DELETE request for account deletion"""
        try:
            # Get authenticated user
            user_id = request.user.id
            user = User.objects.get(id=user_id)

            # Validate credentials
            is_valid, error_response = self.validate_credentials(user, request)
            if not is_valid:
                return error_response

            # Generate deletion token
            access_token, error_response = self.generate_deletion_token(user_id)
            if error_response:
                return error_response

            # Perform account deletion
            if self.perform_account_deletion(user, access_token):
                return JsonResponse(
                    {'message': 'Account deleted successfully'}, 
                    status=200
                )
            else:
                return JsonResponse(
                    {'error': 'Account deletion failed'}, 
                    status=500
                )

        except User.DoesNotExist:
            logger.error("User not found during account deletion")
            return JsonResponse(
                {'error': 'User not found'}, 
                status=404
            )
        except Exception as e:
            logger.error(f"Unexpected error during account deletion: {e}")
            return JsonResponse(
                {'error': f'Unexpected error occurred'}, 
                status=500
            )
        

import json
import random
import string
from datetime import datetime, timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from user.models import User
from django.utils.timezone import now


@method_decorator(csrf_exempt, name='dispatch')
class ForgotPasswordSendCodeView(View):
    """
    Sends a password reset code to the user's email.
    """
    @staticmethod
    def post(request):
        try:
            # Parse the request
            json_request = json.loads(request.body.decode('utf-8'))
            user_email = json_request.get('email')

            if not user_email:
                return JsonResponse({'errors': ['Email is required']}, status=400)

            # Find user
            user = User.objects.filter(email=user_email).first()
            if not user:
                return JsonResponse({'errors': ['User not found']}, status=404)

            # Generate and save reset code
            random_code = ''.join(random.choice(string.digits) for _ in range(settings.FORGOT_PASSWORD_CODE_MAX_LENGTH))
            user.forgotPasswordCode = random_code
            user.forgotPasswordCodeExpiration = now() + timedelta(minutes=settings.FORGOT_PASSWORD_CODE_EXPIRATION_MINUTES)
            user.save()

            # Send email
            subject = "Password Reset Code"
            message = f"Your password reset code is: {random_code}"
            send_mail(subject, message, settings.EMAIL_HOST_USER, [user_email])

            return JsonResponse({'message': 'Reset code sent to your email'}, status=200)
        except Exception as e:
            return JsonResponse({'errors': [f'Error sending reset code: {e}']}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ForgotPasswordCheckCodeView(View):
    """
    Validates the password reset code.
    """
    @staticmethod
    def post(request):
        try:
            # Parse the request
            json_request = json.loads(request.body.decode('utf-8'))
            user_email = json_request.get('email')
            code_provided = json_request.get('code')

            if not user_email or not code_provided:
                return JsonResponse({'errors': ['Email and code are required']}, status=400)

            # Find user
            user = User.objects.filter(email=user_email).first()
            if not user:
                return JsonResponse({'errors': ['User not found']}, status=404)

            # Validate code
            if code_provided != user.forgotPasswordCode:
                return JsonResponse({'errors': ['Invalid reset code']}, status=400)

            if now() > user.forgotPasswordCodeExpiration:
                return JsonResponse({'errors': ['Reset code has expired']}, status=400)

            return JsonResponse({'message': 'Reset code is valid'}, status=200)
        except Exception as e:
            return JsonResponse({'errors': [f'Error verifying code: {e}']}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class ForgotPasswordChangePasswordView(View):
    """
    Changes the user's password after verifying the reset code.
    """
    @staticmethod
    def post(request):
        try:
            json_request = json.loads(request.body.decode('utf-8'))
            user_email = json_request.get('email')
            code_provided = json_request.get('code')
            new_password = json_request.get('new_password')

            if not user_email or not code_provided or not new_password:
                return JsonResponse({'errors': ['Email, code, and new password are required']}, status=400)

            user = User.objects.filter(email=user_email).first()
            if not user:
                return JsonResponse({'errors': ['User not found']}, status=404)

            if code_provided != user.forgotPasswordCode:
                return JsonResponse({'errors': ['Invalid reset code']}, status=400)

            if now() > user.forgotPasswordCodeExpiration:
                return JsonResponse({'errors': ['Reset code has expired']}, status=400)

            if len(new_password) < settings.PASSWORD_MIN_LENGTH:
                return JsonResponse({'errors': [f'Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long']}, status=400)

            user.password = make_password(new_password)
            user.forgotPasswordCode = None
            user.forgotPasswordCodeExpiration = None
            user.save()

            return JsonResponse({'message': 'Password reset successfully'}, status=200)
        except Exception as e:
            return JsonResponse({'errors': [f'Error resetting password: {e}']}, status=500)


