import csv

from django.db import transaction
from django.http import StreamingHttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.announcements.models import Notification
from .models import AuditLog, MembershipRequest, Role, User
from .permissions import HasCapability
from .serializers import (
    MembershipRequestCreateSerializer,
    MembershipRequestSerializer,
    MembershipReviewSerializer,
    RoleAssignmentSerializer,
    AuditLogSerializer,
    UserSerializer,
)


def log_sensitive_action(actor, action, target, metadata=None):
    return AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target._meta.label_lower,
        target_id=str(target.pk),
        metadata=metadata or {},
    )


class Echo:
    def write(self, value):
        return value


def safe_csv_cell(value):
    if isinstance(value, str) and value.lstrip().startswith(("=", "+", "-", "@", "\t", "\r")):
        return f"'{value}"
    return value


class MemberViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    search_fields = ("email", "first_name", "last_name")
    ordering_fields = ("first_name", "last_name", "date_joined")
    filterset_fields = ("is_active", "roles__code")

    def get_queryset(self):
        return User.objects.prefetch_related("roles__capabilities", "profile")

    def get_permissions(self):
        if self.action in {"list", "retrieve", "export"}:
            self.required_capability = "members.view_members"
        elif self.action == "roles":
            self.required_capability = "members.manage_roles"
        else:
            self.required_capability = "members.manage_members"
        return (HasCapability(),)

    @action(detail=False, methods=("get",))
    def export(self, request):
        rows = self.filter_queryset(self.get_queryset()).values_list("id", "first_name", "last_name", "email", "date_joined")
        writer = csv.writer(Echo())

        def output():
            yield writer.writerow(("id", "first_name", "last_name", "email", "date_joined"))
            for row in rows.iterator(chunk_size=500):
                yield writer.writerow(tuple(safe_csv_cell(value) for value in row))

        response = StreamingHttpResponse(output(), content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="myclub-members.csv"'
        return response

    @action(detail=True, methods=("post",))
    def roles(self, request, pk=None):
        serializer = RoleAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = self.get_object()
        requested_roles = serializer.validated_data["roles"]
        if user.pk == request.user.pk:
            if any(role.code == "club_admin" for role in requested_roles):
                raise ValidationError({"roles": "Un administrateur ne peut pas s'attribuer ce rôle."})
            if user.has_role("club_admin") and not any(role.code == "club_admin" for role in requested_roles):
                raise ValidationError({"roles": "Un administrateur ne peut pas retirer son propre rôle."})
        before = list(user.roles.values_list("code", flat=True))
        user.roles.set(requested_roles)
        after = list(user.roles.values_list("code", flat=True))
        log_sensitive_action(request.user, "member.roles_changed", user, {"before": before, "after": after})
        return Response(UserSerializer(user).data)

    @action(detail=True, methods=("post",))
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.pk == request.user.pk:
            raise ValidationError({"detail": "Vous ne pouvez pas désactiver votre propre compte."})
        user.is_active = False
        user.save(update_fields=("is_active", "updated_at"))
        log_sensitive_action(request.user, "member.deactivated", user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=("post",))
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=("is_active", "updated_at"))
        log_sensitive_action(request.user, "member.activated", user)
        return Response(UserSerializer(user).data)


class MembershipRequestViewSet(viewsets.ModelViewSet):
    http_method_names = ("get", "post", "head", "options")
    search_fields = ("user__email", "user__first_name", "user__last_name")
    ordering_fields = ("created_at", "decided_at", "status")
    filterset_fields = ("status",)

    def get_queryset(self):
        queryset = MembershipRequest.objects.select_related("user", "decided_by")
        if self.request.user.has_capability("members.review_membership"):
            return queryset
        return queryset.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "create":
            return MembershipRequestCreateSerializer
        if self.action == "review":
            return MembershipReviewSerializer
        return MembershipRequestSerializer

    def get_permissions(self):
        if self.action == "review":
            self.required_capability = "members.review_membership"
            return (HasCapability(),)
        return (IsAuthenticated(),)

    def perform_create(self, serializer):
        request = serializer.save(user=self.request.user)
        log_sensitive_action(self.request.user, "membership.requested", request)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            MembershipRequestSerializer(serializer.instance).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    @action(detail=False, methods=("get",))
    def mine(self, request):
        queryset = MembershipRequest.objects.filter(user=request.user).select_related("user", "decided_by")
        return Response(MembershipRequestSerializer(queryset, many=True).data)

    @action(detail=True, methods=("post",))
    def review(self, request, pk=None):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            membership = MembershipRequest.objects.select_for_update().select_related("user").get(pk=pk)
            if membership.status not in (MembershipRequest.Status.PENDING, MembershipRequest.Status.INFORMATION_REQUESTED):
                raise ValidationError({"status": "Cette demande a déjà reçu une décision définitive."})
            membership.status = serializer.validated_data["status"]
            membership.decision_note = serializer.validated_data.get("decision_note", "")
            membership.decided_by = request.user
            membership.decided_at = timezone.now()
            membership.save(update_fields=("status", "decision_note", "decided_by", "decided_at", "updated_at"))
            if membership.status == MembershipRequest.Status.APPROVED:
                member_role = Role.objects.get(code="member")
                membership.user.roles.add(member_role)
                membership.user.roles.remove(*membership.user.roles.filter(code="visitor"))
                MemberProfileJoined = membership.user.profile
                if not MemberProfileJoined.joined_at:
                    MemberProfileJoined.joined_at = membership.decided_at
                    MemberProfileJoined.save(update_fields=("joined_at", "updated_at"))
            log_sensitive_action(request.user, "membership.reviewed", membership, {"status": membership.status})
            Notification.objects.create(
                user=membership.user,
                title="Mise à jour de votre demande d'adhésion",
                message=f"Le statut de votre demande est maintenant : {membership.get_status_display()}.",
                resource_type="membership_request",
                resource_id=str(membership.pk),
            )
        return Response(MembershipRequestSerializer(membership).data)


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = (HasCapability,)
    required_capability = "audit.view_audit"

    def get_queryset(self):
        return AuditLog.objects.select_related("actor")
