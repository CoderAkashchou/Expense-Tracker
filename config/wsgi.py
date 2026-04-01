import os
from django.core.wsgi import get_wsgi_application

django_env = os.getenv("DJANGO_ENV", "production").lower()

if django_env == "production":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")
else:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

application = get_wsgi_application()
