from django.db.models import Q
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response

from apps.members.models import AuditLog, User
from apps.announcements.models import Notification
from .models import Milestone, Project, ProjectFile, ProjectMembership, Task, TaskComment
from .serializers import (
    MilestoneSerializer,
    ProjectFileSerializer,
    ProjectMembershipSerializer,
    ProjectSerializer,
    TaskCommentSerializer,
    TaskSerializer,
)

PUBLIC_PROJECT_STATUSES = (
    Project.Status.APPROVED,
    Project.Status.PLANNED,
    Project.Status.IN_PROGRESS,
    Project.Status.IN_REVIEW,
    Project.Status.COMPLETED,
)


def can_manage_project(user, project, capability="projects.manage_team"):
    return bool(
        user.is_authenticated
        and (
            user.has_capability("projects.manage_projects")
            or project.lead_id == user.pk
            or project.memberships.filter(user=user, role=ProjectMembership.Role.LEAD).exists()
            or (user.has_capability(capability) and project.memberships.filter(user=user, role=ProjectMembership.Role.SUPERVISOR).exists())
        )
    )


def can_access_project(user, project):
    if project.is_public and project.status in PUBLIC_PROJECT_STATUSES:
        return True
    return bool(
        user.is_authenticated
        and (user.has_capability("projects.manage_projects") or project.created_by_id == user.pk or project.lead_id == user.pk or project.memberships.filter(user=user).exists())
    )


class ProjectAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if view.action in {"list", "retrieve", "dashboard"}:
            return True
        if not request.user.is_authenticated:
            return False
        return request.user.has_capability("projects.propose_project") or request.user.has_capability("projects.manage_projects") or request.user.has_capability("projects.manage_team")

    def has_object_permission(self, request, view, project):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return can_access_project(request.user, project)
        return can_manage_project(request.user, project)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = (ProjectAccessPermission,)
    search_fields = ("name", "description", "domain")
    filterset_fields = ("status", "domain", "priority", "is_public")
    ordering_fields = ("name", "created_at", "updated_at", "due_date")

    def get_queryset(self):
        queryset = Project.objects.select_related("lead", "created_by").prefetch_related("memberships", "tasks")
        user = self.request.user
        if not user.is_authenticated:
            return queryset.filter(is_public=True, status__in=PUBLIC_PROJECT_STATUSES)
        if user.has_capability("projects.manage_projects") or user.has_capability("dashboard.view_all"):
            return queryset
        return queryset.filter(
            Q(is_public=True, status__in=PUBLIC_PROJECT_STATUSES)
            | Q(lead=user)
            | Q(members=user)
            | Q(created_by=user)
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        status_value = serializer.validated_data.get("status", Project.Status.PROPOSED)
        if not user.has_capability("projects.manage_projects"):
            status_value = Project.Status.PROPOSED
        project = serializer.save(
            created_by=user,
            status=status_value,
            lead=serializer.validated_data.get("lead") if user.has_capability("projects.manage_projects") else None,
            is_public=serializer.validated_data.get("is_public", False) if user.has_capability("projects.manage_projects") else False,
        )
        if project.lead_id:
            ProjectMembership.objects.get_or_create(project=project, user_id=project.lead_id, defaults={"role": ProjectMembership.Role.LEAD})
        AuditLog.objects.create(actor=user, action="project.created", target_type="projects.project", target_id=str(project.pk))

    def perform_update(self, serializer):
        previous_lead_id = serializer.instance.lead_id
        project = serializer.save()
        if project.lead_id:
            ProjectMembership.objects.get_or_create(project=project, user_id=project.lead_id, defaults={"role": ProjectMembership.Role.LEAD})
        if previous_lead_id and previous_lead_id != project.lead_id:
            ProjectMembership.objects.filter(project=project, user_id=previous_lead_id, role=ProjectMembership.Role.LEAD).update(role=ProjectMembership.Role.MEMBER)
        AuditLog.objects.create(actor=self.request.user, action="project.updated", target_type="projects.project", target_id=str(project.pk))

    @action(detail=True, methods=("get",))
    def dashboard(self, request, pk=None):
        project = self.get_object()
        tasks = project.tasks.all()
        return Response({
            "project": ProjectSerializer(project).data,
            "tasks_by_status": {status_key: tasks.filter(status=status_key).count() for status_key, _ in Task.Status.choices},
            "overdue_tasks": tasks.filter(due_date__lt=timezone.localdate()).exclude(status=Task.Status.DONE).count(),
            "milestones": MilestoneSerializer(project.milestones.all(), many=True).data,
        })


class TaskAccessPermission(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action in {"list", "retrieve", "comments"}:
            return True
        if view.action in {"update", "partial_update", "destroy"}:
            return True
        return request.user.has_capability("projects.manage_tasks") or request.user.has_capability("projects.manage_projects") or request.user.has_capability("projects.manage_team")

    def has_object_permission(self, request, view, task):
        manager = can_manage_project(request.user, task.project, capability="projects.manage_tasks")
        if view.action == "destroy":
            return manager
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return manager or task.assignee_id == request.user.pk or task.project.created_by_id == request.user.pk or task.project.memberships.filter(user=request.user).exists()
        if view.action == "comments":
            return manager or task.assignee_id == request.user.pk or task.project.memberships.filter(user=request.user).exists()
        return manager or task.assignee_id == request.user.pk


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = (TaskAccessPermission,)
    search_fields = ("title", "description", "project__name")
    filterset_fields = ("status", "priority", "project", "assignee")
    ordering_fields = ("due_date", "created_at", "updated_at")

    def get_queryset(self):
        user = self.request.user
        queryset = Task.objects.select_related("project", "assignee", "created_by")
        if not user.is_authenticated:
            return queryset.none()
        if user.has_capability("projects.manage_projects") or user.has_capability("dashboard.view_all"):
            return queryset
        return queryset.filter(Q(assignee=user) | Q(project__lead=user) | Q(project__members=user) | Q(project__created_by=user)).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        if not can_manage_project(self.request.user, project, capability="projects.manage_tasks"):
            raise PermissionDenied("Vous ne pouvez pas créer des tâches dans ce projet.")
        assignee = serializer.validated_data.get("assignee")
        if assignee and not project.memberships.filter(user=assignee).exists() and project.lead_id != assignee.pk:
            raise ValidationError({"assignee": "La personne affectée doit appartenir à l'équipe du projet."})
        serializer.save(created_by=self.request.user)
        assignee = serializer.instance.assignee
        if assignee:
            Notification.objects.create(
                user=assignee,
                title="Nouvelle tâche attribuée",
                message=serializer.instance.title,
                resource_type="task",
                resource_id=str(serializer.instance.pk),
            )

    def update(self, request, *args, **kwargs):
        task = self.get_object()
        previous_assignee_id = task.assignee_id
        previous_due_date = task.due_date
        is_manager = can_manage_project(request.user, task.project, capability="projects.manage_tasks")
        if not is_manager and set(request.data.keys()) - {"status"}:
            raise PermissionDenied("Un membre affecté peut uniquement modifier le statut de sa tâche.")
        response = super().update(request, *args, **kwargs)
        task.refresh_from_db()
        if task.assignee_id and (task.assignee_id != previous_assignee_id or task.due_date != previous_due_date):
            Notification.objects.create(
                user=task.assignee,
                title="Mise à jour de votre tâche",
                message=f"{task.title} · échéance {task.due_date.isoformat() if task.due_date else 'non définie'}",
                resource_type="task",
                resource_id=str(task.pk),
            )
        AuditLog.objects.create(actor=request.user, action="task.updated", target_type="projects.task", target_id=str(task.pk), metadata={"status": task.status})
        return response

    @action(detail=True, methods=("get", "post"))
    def comments(self, request, pk=None):
        task = self.get_object()
        if request.method == "GET":
            return Response(TaskCommentSerializer(task.comments.select_related("author"), many=True).data)
        serializer = TaskCommentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(task=task, author=request.user)
        return Response(TaskCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class MilestonePermission(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, milestone):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return can_access_project(request.user, milestone.project)
        return can_manage_project(request.user, milestone.project)


class MilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer
    permission_classes = (MilestonePermission,)
    filterset_fields = ("project",)

    def get_queryset(self):
        user = self.request.user
        queryset = Milestone.objects.select_related("project")
        if user.has_capability("projects.manage_projects") or user.has_capability("dashboard.view_all"):
            return queryset
        return queryset.filter(Q(project__lead=user) | Q(project__members=user)).distinct()

    def perform_create(self, serializer):
        if not can_manage_project(self.request.user, serializer.validated_data["project"]):
            raise PermissionDenied("Vous ne pouvez pas gérer les jalons de ce projet.")
        serializer.save()

    def perform_update(self, serializer):
        if not can_manage_project(self.request.user, serializer.instance.project):
            raise PermissionDenied("Vous ne pouvez pas modifier ce jalon.")
        serializer.save()

    def perform_destroy(self, instance):
        if not can_manage_project(self.request.user, instance.project):
            raise PermissionDenied("Vous ne pouvez pas supprimer ce jalon.")
        instance.delete()

    @action(detail=True, methods=("post",))
    def complete(self, request, pk=None):
        milestone = self.get_object()
        milestone.completed_at = timezone.now()
        milestone.save(update_fields=("completed_at", "updated_at"))
        return Response(self.get_serializer(milestone).data)

    @action(detail=True, methods=("post",))
    def reopen(self, request, pk=None):
        milestone = self.get_object()
        milestone.completed_at = None
        milestone.save(update_fields=("completed_at", "updated_at"))
        return Response(self.get_serializer(milestone).data)


class ProjectMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMembershipSerializer
    permission_classes = (IsAuthenticated,)
    http_method_names = ("get", "post", "delete", "head", "options")
    filterset_fields = ("project", "role")

    def get_queryset(self):
        user = self.request.user
        queryset = ProjectMembership.objects.select_related("project", "user")
        if user.has_capability("projects.manage_projects") or user.has_capability("dashboard.view_all"):
            return queryset
        return queryset.filter(Q(project__lead=user) | Q(project__members=user)).distinct()

    @action(detail=False, methods=("get",))
    def candidates(self, request):
        project = Project.objects.filter(pk=request.query_params.get("project")).first()
        if not project:
            raise ValidationError({"project": "Projet introuvable."})
        if not can_manage_project(request.user, project):
            raise PermissionDenied("Vous ne pouvez pas modifier l'équipe de ce projet.")

        club_roles = (
            "member",
            "club_admin",
            "project_lead",
            "president",
            "event_manager",
            "pedagogical_supervisor",
            "communications_manager",
        )
        candidates = User.objects.filter(is_active=True, roles__code__in=club_roles).exclude(
            Q(project_memberships__project=project) | Q(led_projects=project)
        ).distinct().order_by("last_name", "first_name", "id")
        page = self.paginate_queryset(candidates)
        users = page if page is not None else candidates
        data = [{"id": user.pk, "full_name": user.get_full_name()} for user in users]
        return self.get_paginated_response(data) if page is not None else Response(data)

    def create(self, request, *args, **kwargs):
        project_id = request.data.get("project")
        project = Project.objects.filter(pk=project_id).first()
        if not project or not can_manage_project(request.user, project):
            raise PermissionDenied("Vous ne pouvez pas modifier l'équipe de ce projet.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team_user = serializer.validated_data["user"]
        if not team_user.is_active or not team_user.is_club_member:
            raise ValidationError({"user": "Seul un compte actif ayant un rôle de membre du club peut rejoindre une équipe."})
        membership, created = ProjectMembership.objects.get_or_create(
            project=project,
            user=team_user,
            defaults={"role": serializer.validated_data.get("role", ProjectMembership.Role.MEMBER)},
        )
        if created:
            Notification.objects.create(
                user=membership.user,
                title="Ajouté à un projet",
                message=project.name,
                resource_type="project",
                resource_id=str(project.pk),
            )
        return Response(self.get_serializer(membership).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    def perform_destroy(self, instance):
        if not can_manage_project(self.request.user, instance.project):
            raise PermissionDenied("Vous ne pouvez pas modifier l'équipe de ce projet.")
        instance.delete()


class TaskCommentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TaskCommentSerializer
    permission_classes = (IsAuthenticated,)
    filterset_fields = ("task",)

    def get_queryset(self):
        return TaskComment.objects.filter(Q(task__assignee=self.request.user) | Q(task__project__lead=self.request.user) | Q(task__project__members=self.request.user) | Q(task__project__created_by=self.request.user)).distinct()


class ProjectFileViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectFileSerializer
    permission_classes = (IsAuthenticated,)
    http_method_names = ("get", "post", "delete", "head", "options")
    filterset_fields = ("project", "task")

    def get_queryset(self):
        user = self.request.user
        queryset = ProjectFile.objects.select_related("project", "task", "uploaded_by")
        if user.has_capability("projects.manage_projects"):
            return queryset
        return queryset.filter(Q(project__lead=user) | Q(project__members=user) | Q(project__created_by=user)).distinct()

    def perform_create(self, serializer):
        project = serializer.validated_data["project"]
        user = self.request.user
        if not (
            user.has_capability("projects.manage_projects")
            or project.created_by_id == user.pk
            or project.lead_id == user.pk
            or project.memberships.filter(user=user).exists()
        ):
            raise PermissionDenied("Vous ne pouvez pas déposer un fichier dans ce projet.")
        serializer.save(uploaded_by=user)

    @action(detail=True, methods=("get",))
    def download(self, request, pk=None):
        stored_file = self.get_object()
        try:
            stored_file.file.open("rb")
        except (FileNotFoundError, OSError):
            raise Http404
        return FileResponse(stored_file.file, as_attachment=True, filename=stored_file.original_name, content_type=stored_file.content_type)

    def perform_destroy(self, instance):
        if not can_manage_project(self.request.user, instance.project) and instance.uploaded_by_id != self.request.user.pk:
            raise PermissionDenied("Vous ne pouvez pas supprimer ce fichier.")
        instance.file.delete(save=False)
        instance.delete()
