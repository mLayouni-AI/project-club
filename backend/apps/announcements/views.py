from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from apps.members.models import AuditLog, User
from .models import Announcement, Notification
from .serializers import AnnouncementSerializer, NotificationSerializer


class AnnouncementPermission(BasePermission):
    def has_permission(self, request, view):
        if view.action in {"list", "retrieve"}:
            return True
        return bool(request.user.is_authenticated and request.user.has_capability("announcements.manage_announcements"))

    def has_object_permission(self, request, view, announcement):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return announcement.status == Announcement.Status.PUBLISHED and (
                announcement.audience == Announcement.Audience.PUBLIC
                or (request.user.is_authenticated and request.user.is_club_member)
            )
        return bool(request.user.is_authenticated and request.user.has_capability("announcements.manage_announcements"))


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = (AnnouncementPermission,)
    search_fields = ("title", "content")
    filterset_fields = ("status", "audience")
    ordering_fields = ("published_at", "created_at", "title")

    def get_queryset(self):
        queryset = Announcement.objects.select_related("author")
        user = self.request.user
        if user.is_authenticated and user.has_capability("announcements.manage_announcements"):
            return queryset
        visible = Q(status=Announcement.Status.PUBLISHED, audience=Announcement.Audience.PUBLIC)
        if user.is_authenticated and user.is_club_member:
            visible |= Q(status=Announcement.Status.PUBLISHED, audience=Announcement.Audience.MEMBERS)
        return queryset.filter(visible)

    def perform_create(self, serializer):
        announcement = serializer.save(author=self.request.user)
        AuditLog.objects.create(actor=self.request.user, action="announcement.created", target_type="announcements.announcement", target_id=str(announcement.pk))

    def perform_update(self, serializer):
        announcement = serializer.save()
        AuditLog.objects.create(actor=self.request.user, action="announcement.updated", target_type="announcements.announcement", target_id=str(announcement.pk))

    def perform_destroy(self, instance):
        AuditLog.objects.create(actor=self.request.user, action="announcement.deleted", target_type="announcements.announcement", target_id=str(instance.pk))
        instance.delete()

    @action(detail=True, methods=("post",))
    def publish(self, request, pk=None):
        announcement = self.get_object()
        was_published = announcement.status == Announcement.Status.PUBLISHED
        announcement.status = Announcement.Status.PUBLISHED
        announcement.published_at = timezone.now()
        announcement.save(update_fields=("status", "published_at", "updated_at"))
        if not was_published:
            recipients = User.objects.filter(is_active=True)
            if announcement.audience == Announcement.Audience.MEMBERS:
                recipients = recipients.filter(roles__code__in=(
                    "member", "club_admin", "project_lead", "president", "event_manager",
                    "pedagogical_supervisor", "communications_manager",
                )).distinct()
            Notification.objects.bulk_create([
                Notification(
                    user_id=user_id,
                    title="Nouvelle annonce du Club DIA",
                    message=announcement.title,
                    resource_type="announcement",
                    resource_id=str(announcement.pk),
                )
                for user_id in recipients.exclude(pk=request.user.pk).values_list("pk", flat=True)
            ], batch_size=500)
        AuditLog.objects.create(actor=request.user, action="announcement.published", target_type="announcements.announcement", target_id=str(announcement.pk))
        return Response(self.get_serializer(announcement).data)

    @action(detail=True, methods=("post",))
    def unpublish(self, request, pk=None):
        announcement = self.get_object()
        announcement.status = Announcement.Status.DRAFT
        announcement.published_at = None
        announcement.save(update_fields=("status", "published_at", "updated_at"))
        AuditLog.objects.create(actor=request.user, action="announcement.unpublished", target_type="announcements.announcement", target_id=str(announcement.pk))
        return Response(self.get_serializer(announcement).data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    filterset_fields = ("read_at",)
    ordering_fields = ("created_at", "read_at")

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=("post",))
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=("read_at",))
        return Response(self.get_serializer(notification).data)

    @action(detail=False, methods=("post",))
    def mark_all_read(self, request):
        Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response(status=status.HTTP_204_NO_CONTENT)
