#!/usr/bin/env python
import os
import sys

def main():
    django_env = os.getenv("DJANGO_ENV", "development").lower()

    if django_env == "production":
        settings_module = "config.settings.prod"
    else:
        settings_module = "config.settings.dev"

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)

    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)

if __name__ == "__main__":
    main()
