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
