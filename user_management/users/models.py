from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.timezone import now
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import make_password
import pyotp

class User(AbstractUser):
    """
    Custom User model that extends Django's AbstractUser.
    Includes additional fields for email verification, 2FA, and activity tracking.
    """
from django.core.validators import MaxLengthValidator, MinLengthValidator
from django.db import models
from django.contrib.auth.models import AbstractUser

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.timezone import now
import pyotp

class User(AbstractUser):
    email = models.EmailField(unique=True, max_length=60)
    email_verified = models.BooleanField(default=False)
    has_2fa = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=32, blank=True, null=True)
    last_activity = models.DateTimeField(null=True, blank=True)

    def update_last_activity(self):
        self.last_activity = now()
        self.save(update_fields=['last_activity'])

    def enable_2fa(self):
        if not self.has_2fa:
            self.totp_secret = pyotp.random_base32()
            self.has_2fa = True
            self.save(update_fields=['totp_secret', 'has_2fa'])

    def verify_2fa(self, code):
        if not self.has_2fa or not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(code)


    def save(self, *args, **kwargs):
        """
        Override the save method to ensure password hashing and any other custom behavior.
        """
        if self.password and not self.password.startswith('pbkdf2_'):
            self.password = make_password(self.password)
        super(User, self).save(*args, **kwargs)



    def disable_2fa(self):
        """
        Disables 2FA for the user and clears the TOTP secret.
        """
        if self.has_2fa:
            self.totp_secret = None
            self.has_2fa = False
            self.save(update_fields=['totp_secret', 'has_2fa'])

    def __str__(self):
        return self.username

    def clean(self):
        """
        Add custom validation logic here (optional).
        Example: Ensure username does not conflict with email.
        """
        if self.username == self.email:
            raise ValidationError("Username and email cannot be the same.")
