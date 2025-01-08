import jwt
import datetime
from django.conf import settings
from jwt import ExpiredSignatureError, InvalidTokenError

class JWTManager:
    """
    A utility class for handling JWT tokens (creation, validation, and refreshing).
    """

    @staticmethod
    def create_access_token(user_id):
        """
        Creates a short-lived access token for the user.
        Args:
            user_id (int): The ID of the user.
        Returns:
            str: Encoded JWT access token.
        """
        payload = {
            'user_id': user_id,
            'type': 'access',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_EXPIRATION_MINUTES),
            'iat': datetime.datetime.utcnow(),
        }
        return jwt.encode(payload, settings.ACCESS_PRIVATE_KEY, algorithm='RS256')

    @staticmethod
    def create_refresh_token(user_id):
        """
        Creates a long-lived refresh token for the user.
        Args:
            user_id (int): The ID of the user.
        Returns:
            str: Encoded JWT refresh token.
        """
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=settings.REFRESH_EXPIRATION_MINUTES // (24 * 60)),
            'iat': datetime.datetime.utcnow(),
        }
        return jwt.encode(payload, settings.ACCESS_PRIVATE_KEY, algorithm='RS256')

    @staticmethod
    def decode_token(token):
        """
        Decodes and validates a JWT token.
        Args:
            token (str): The JWT token to decode.
        Returns:
            dict: Decoded payload if the token is valid.
        Raises:
            ExpiredSignatureError: If the token has expired.
            InvalidTokenError: If the token is invalid or tampered with.
        """
        try:
            return jwt.decode(token, settings.ACCESS_PUBLIC_KEY, algorithms=['RS256'])
        except ExpiredSignatureError:
            raise ExpiredSignatureError("Token has expired")
        except InvalidTokenError:
            raise InvalidTokenError("Invalid token")

    @staticmethod
    def validate_access_token(token):
        """
        Validates an access token.
        Args:
            token (str): The JWT access token to validate.
        Returns:
            dict: Decoded payload if the token is valid.
        Raises:
            ExpiredSignatureError: If the token has expired.
            InvalidTokenError: If the token is invalid or tampered with.
        """
        payload = JWTManager.decode_token(token)
        if payload.get('type') != 'access':
            raise InvalidTokenError("Invalid token type: expected 'access'")
        return payload

    @staticmethod
    def validate_refresh_token(token):
        """
        Validates a refresh token.
        Args:
            token (str): The JWT refresh token to validate.
        Returns:
            dict: Decoded payload if the token is valid.
        Raises:
            ExpiredSignatureError: If the token has expired.
            InvalidTokenError: If the token is invalid or tampered with.
        """
        payload = JWTManager.decode_token(token)
        if payload.get('type') != 'refresh':
            raise InvalidTokenError("Invalid token type: expected 'refresh'")
        return payload

    @staticmethod
    def refresh_access_token(refresh_token):
        """
        Generates a new access token from a valid refresh token.
        Args:
            refresh_token (str): The JWT refresh token.
        Returns:
            str: New JWT access token.
        Raises:
            ExpiredSignatureError: If the refresh token has expired.
            InvalidTokenError: If the refresh token is invalid or tampered with.
        """
        payload = JWTManager.validate_refresh_token(refresh_token)
        user_id = payload.get('user_id')
        return JWTManager.create_access_token(user_id)
