from .base import *
from dotenv import load_dotenv
import os

load_dotenv()

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Database configuration
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

# IMPORTANT: Remove local media override
# Don't override MEDIA_URL and DEFAULT_FILE_STORAGE here
# Let base.py handle S3 configuration if credentials exist

# Optional: Add this for debugging
if DEBUG:
    import logging
    logging.basicConfig()
    logger = logging.getLogger('django')
    logger.setLevel(logging.DEBUG)
    
    # Log S3 configuration
    if AWS_STORAGE_BUCKET_NAME and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        print(f"Using S3 storage: {AWS_STORAGE_BUCKET_NAME}")
        print(f"Media URL: {MEDIA_URL}")
    else:
        print("Warning: S3 credentials not found. Using local storage.")