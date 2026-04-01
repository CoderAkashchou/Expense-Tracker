from .base import *
from decouple import config

DEBUG = False

ALLOWED_HOSTS = config("ALLOWED_HOSTS").split(",")

CSRF_TRUSTED_ORIGINS = [
    "https://akashcloud.shop",
    "https://www.akashcloud.shop",
]

# Trust CloudFront HTTPS header
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Keep secure cookies
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# IMPORTANT: Do NOT force HTTPS from Django
SECURE_SSL_REDIRECT = False

# Disable HSTS (important for EB default domain access)
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
    }
}