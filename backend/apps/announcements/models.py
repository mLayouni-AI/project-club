from django.conf import settings
from django.db import models


class Announcement(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        ARCHIVED = "archived", "Archived"

    class Audience(models.TextChoices):
        PUBLIC = "public", "Public"
        MEMBERS = "members", "Members"

    title = models.CharField(max_length=200)
    content = models.TextField(max_length=10000)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="announcements")
    audience = models.CharField(max_length=16, choices=Audience.choices, default=Audience.MEMBERS)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-published_at", "-created_at")

    def __str__(self):
        return self.title


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=200)
    message = models.CharField(max_length=1000)
    resource_type = models.CharField(max_length=60, blank=True)
    resource_id = models.CharField(max_length=64, blank=True)
    read_at = models.DateTimeField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=("user", "read_at", "created_at"), name="notification_user_read_idx")]
