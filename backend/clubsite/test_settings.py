"""Isolated fast test settings. Production and development use PostgreSQL settings.py."""

from .settings import *  # noqa: F403

DEBUG = True
SECURE_SSL_REDIRECT = False
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
