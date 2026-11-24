
from django.conf import settings
from django.db import models


class Event(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        FULL = "full", "Full"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Audience(models.TextChoices):
        PUBLIC = "public", "Public"
        MEMBERS = "members", "Members"

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=80, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True, db_index=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    responsible = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="managed_events")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT, db_index=True)
    audience = models.CharField(max_length=16, choices=Audience.choices, default=Audience.PUBLIC)
    details = models.TextField(blank=True)
    legacy_id = models.CharField(max_length=64, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("starts_at", "name")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(ends_at__isnull=True) | models.Q(starts_at__isnull=True) | models.Q(ends_at__gte=models.F("starts_at")),
                name="event_end_after_start",
            ),
            models.CheckConstraint(
                condition=models.Q(capacity__isnull=True) | models.Q(capacity__gt=0),
                name="event_capacity_positive",
            ),
        ]
        indexes = [models.Index(fields=("status", "starts_at"), name="event_status_start_idx")]

    def __str__(self):
        return self.name


class EventRegistration(models.Model):
    class Status(models.TextChoices):
        REGISTERED = "registered", "Registered"
        CANCELLED = "cancelled", "Cancelled"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="event_registrations")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.REGISTERED)
    registered_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("registered_at",)
        constraints = [models.UniqueConstraint(fields=("event", "user"), name="unique_event_registration")]


class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="attendance_records")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attendance_records")
    status = models.CharField(max_length=12, choices=Status.choices)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="recorded_attendance")
    recorded_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("event_id", "user_id")
        constraints = [models.UniqueConstraint(fields=("event", "user"), name="unique_event_attendance")]
