from django.db import transaction
from django.db.models import Count, Exists, OuterRef, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from apps.announcements.models import Notification
from apps.members.models import AuditLog
from .models import Attendance, Event, EventRegistration
from .serializers import AttendanceMarkSerializer, AttendanceSerializer, EventRegistrationSerializer, EventSerializer


def can_manage_event(user, event):
    if not user.is_authenticated:
        return False
    return bool(
        event.responsible_id == user.pk
        or (user.has_role("club_admin") and user.has_capability("events.manage_events"))
    )


def can_delegate_event(user):
    return bool(user.is_authenticated and user.has_role("club_admin") and user.has_capability("events.manage_events"))


class EventAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if view.action in {"list", "retrieve"}:
            return True
        return bool(request.user.is_authenticated and (request.user.has_capability("events.manage_events") or view.action in {"register", "cancel_registration"}))

    def has_object_permission(self, request, view, event):
        if view.action in {"register", "cancel_registration"}:
            return request.user.is_authenticated
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return event.status in (Event.Status.PUBLISHED, Event.Status.FULL, Event.Status.COMPLETED) and (
                event.audience == Event.Audience.PUBLIC
            or (request.user.is_authenticated and (request.user.is_club_member or can_manage_event(request.user, event)))
            )
        return can_manage_event(request.user, event)


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = (EventAccessPermission,)
    search_fields = ("name", "description", "location", "event_type")
    filterset_fields = ("status", "audience", "event_type")
    ordering_fields = ("starts_at", "created_at", "name")

    def get_queryset(self):
        user = self.request.user
        queryset = Event.objects.select_related("responsible").annotate(
            _registration_count=Count("registrations", filter=Q(registrations__status=EventRegistration.Status.REGISTERED), distinct=True)
        )
        if user.is_authenticated:
            active_registration = EventRegistration.objects.filter(
                event_id=OuterRef("pk"),
                user=user,
                status=EventRegistration.Status.REGISTERED,
            )
            queryset = queryset.annotate(_is_registered=Exists(active_registration))
        if not user.is_authenticated:
            return queryset.filter(status__in=(Event.Status.PUBLISHED, Event.Status.FULL), audience=Event.Audience.PUBLIC)
        if user.has_role("club_admin") and user.has_capability("events.manage_events") or user.has_capability("dashboard.view_all"):
            return queryset
        if user.has_capability("events.manage_events"):
            return queryset.filter(responsible=user)
        visible = Q(status__in=(Event.Status.PUBLISHED, Event.Status.FULL), audience=Event.Audience.PUBLIC) | Q(responsible=user)
        if user.is_club_member:
            visible |= Q(status__in=(Event.Status.PUBLISHED, Event.Status.FULL), audience=Event.Audience.MEMBERS)
        return queryset.filter(visible).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        requested_responsible = serializer.validated_data.get("responsible")
        if not can_delegate_event(user) and requested_responsible and requested_responsible.pk != user.pk:
            raise PermissionDenied("Seul un administrateur du club peut déléguer la responsabilité d'un événement.")
        event = serializer.save(responsible=requested_responsible or user)
        AuditLog.objects.create(actor=self.request.user, action="event.created", target_type="events.event", target_id=str(event.pk))

    def perform_update(self, serializer):
        requested_responsible = serializer.validated_data.get("responsible", serializer.instance.responsible)
        if not can_delegate_event(self.request.user) and requested_responsible and requested_responsible.pk != self.request.user.pk:
            raise PermissionDenied("Seul un administrateur du club peut déléguer la responsabilité d'un événement.")
        if not can_delegate_event(self.request.user) and requested_responsible is None:
            raise PermissionDenied("Un responsable ne peut pas retirer sa propre responsabilité.")
        event = serializer.save()
        AuditLog.objects.create(actor=self.request.user, action="event.updated", target_type="events.event", target_id=str(event.pk))

    def _refresh_full_status(self, event):
        if event.capacity is None:
            return
        active = event.registrations.filter(status=EventRegistration.Status.REGISTERED).count()
        if active >= event.capacity and event.status == Event.Status.PUBLISHED:
            event.status = Event.Status.FULL
            event.save(update_fields=("status", "updated_at"))
        elif active < event.capacity and event.status == Event.Status.FULL:
            event.status = Event.Status.PUBLISHED
            event.save(update_fields=("status", "updated_at"))

    @action(detail=True, methods=("post",))
    def register(self, request, pk=None):
        with transaction.atomic():
            event = Event.objects.select_for_update().get(pk=pk)
            if event.status not in (Event.Status.PUBLISHED, Event.Status.FULL):
                raise ValidationError({"event": "Les inscriptions à cet événement ne sont pas ouvertes."})
            if event.audience == Event.Audience.MEMBERS and not request.user.is_club_member:
                raise PermissionDenied("Cet événement est réservé aux membres du club.")
            existing = EventRegistration.objects.filter(event=event, user=request.user).first()
            if existing and existing.status == EventRegistration.Status.REGISTERED:
                return Response(EventRegistrationSerializer(existing).data, status=status.HTTP_200_OK)
            count = event.registrations.filter(status=EventRegistration.Status.REGISTERED).count()
            if event.capacity is not None and count >= event.capacity:
                event.status = Event.Status.FULL
                event.save(update_fields=("status", "updated_at"))
                raise ValidationError({"event": "La capacité maximale de cet événement est atteinte."})
            if existing:
                existing.status = EventRegistration.Status.REGISTERED
                existing.cancelled_at = None
                existing.registered_at = timezone.now()
                existing.save(update_fields=("status", "cancelled_at", "registered_at"))
                registration = existing
            else:
                registration = EventRegistration.objects.create(event=event, user=request.user)
            self._refresh_full_status(event)
            Notification.objects.create(
                user=request.user,
                title="Inscription confirmée",
                message=f"Votre inscription à « {event.name} » est confirmée.",
                resource_type="event",
                resource_id=str(event.pk),
            )
        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=("post",))
    def cancel_registration(self, request, pk=None):
        with transaction.atomic():
            event = Event.objects.select_for_update().get(pk=pk)
            registration = EventRegistration.objects.filter(event=event, user=request.user, status=EventRegistration.Status.REGISTERED).first()
            if not registration:
                raise ValidationError({"registration": "Aucune inscription active n'a été trouvée."})
            registration.status = EventRegistration.Status.CANCELLED
            registration.cancelled_at = timezone.now()
            registration.save(update_fields=("status", "cancelled_at"))
            self._refresh_full_status(event)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=("get",))
    def participants(self, request, pk=None):
        event = self.get_object()
        if not can_manage_event(request.user, event):
            raise PermissionDenied("Vous ne pouvez pas consulter la liste des inscrits.")
        registrations = event.registrations.filter(status=EventRegistration.Status.REGISTERED).select_related("user")
        page = self.paginate_queryset(registrations)
        serializer = EventRegistrationSerializer(page or registrations, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    @action(detail=True, methods=("get",))
    def export_participants(self, request, pk=None):
        import csv
        from django.http import StreamingHttpResponse

        event = self.get_object()
        if not can_manage_event(request.user, event):
            raise PermissionDenied("Vous ne pouvez pas exporter la liste des participants.")

        class Echo:
            def write(self, value):
                return value

        def safe_cell(val):
            if isinstance(val, str) and val.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")):
                return f"'{val}"
            return val

        attendance_map = {rec.user_id: rec.get_status_display() for rec in event.attendance_records.all()}
        registrations = event.registrations.filter(status=EventRegistration.Status.REGISTERED).select_related("user")
        writer = csv.writer(Echo())

        def generate():
            yield writer.writerow(("id", "nom_complet", "email", "date_inscription", "presence"))
            for reg in registrations:
                yield writer.writerow((
                    safe_cell(reg.user.pk),
                    safe_cell(reg.user.get_full_name()),
                    safe_cell(reg.user.email),
                    safe_cell(reg.registered_at.strftime("%Y-%m-%d %H:%M:%S") if reg.registered_at else ""),
                    safe_cell(attendance_map.get(reg.user_id, "Non marqué")),
                ))

        response = StreamingHttpResponse(generate(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="event-{event.pk}-participants.csv"'
        return response

    @action(detail=True, methods=("get", "post"))
    def attendance(self, request, pk=None):
        event = self.get_object()
        if not can_manage_event(request.user, event):
            raise PermissionDenied("Vous ne pouvez pas gérer les présences de cet événement.")
        if request.method == "GET":
            records = event.attendance_records.select_related("user", "recorded_by")
            return Response(AttendanceSerializer(records, many=True).data)
        serializer = AttendanceMarkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data["user"]
        if not event.registrations.filter(user_id=user_id, status=EventRegistration.Status.REGISTERED).exists():
            raise ValidationError({"user": "La présence ne peut être enregistrée que pour une personne inscrite."})
        attendance, _ = Attendance.objects.update_or_create(
            event=event,
            user_id=user_id,
            defaults={"status": serializer.validated_data["status"], "recorded_by": request.user},
        )
        AuditLog.objects.create(actor=request.user, action="attendance.updated", target_type="events.attendance", target_id=str(attendance.pk), metadata={"status": attendance.status})
        return Response(AttendanceSerializer(attendance).data)
