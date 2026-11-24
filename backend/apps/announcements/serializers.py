from rest_framework import serializers

from .models import Announcement, Notification


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True, allow_null=True)

    class Meta:
        model = Announcement
        fields = ("id", "title", "content", "author", "author_name", "audience", "status", "published_at", "created_at", "updated_at")
        read_only_fields = ("id", "author", "author_name", "status", "published_at", "created_at", "updated_at")


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ("id", "title", "message", "resource_type", "resource_id", "read_at", "created_at")
        read_only_fields = fields
