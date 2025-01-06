from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    # Add custom fields if needed, e.g.:
    # avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    pass
