from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.announcements.models import Announcement, Notification
from apps.events.models import Event, EventRegistration
from apps.projects.models import Milestone, Project, Task
from .models import AuditLog, MembershipRequest, User


class DashboardView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        user = request.user
        today = timezone.localdate()
        result = {"roles": list(user.roles.values_list("code", flat=True)), "generated_at": timezone.now()}

        if user.has_capability("members.manage_members"):
            result["administration"] = {
                "active_members": User.objects.filter(is_active=True, roles__code="member").distinct().count(),
                "pending_membership_requests": MembershipRequest.objects.filter(status=MembershipRequest.Status.PENDING).count(),
                "projects_by_status": list(Project.objects.values("status").annotate(count=Count("id")).order_by("status")),
                "upcoming_events": Event.objects.filter(status__in=(Event.Status.PUBLISHED, Event.Status.FULL), starts_at__gte=timezone.now()).count(),
                "overdue_tasks": Task.objects.filter(due_date__lt=today).exclude(status=Task.Status.DONE).count(),
                "recent_members": list(User.objects.filter(roles__code="member").distinct().order_by("-date_joined").values("id", "first_name", "last_name", "date_joined")[:5]),
                "recent_sensitive_activity": list(AuditLog.objects.select_related("actor").values("id", "action", "target_type", "target_id", "created_at", "actor__email")[:8]),
            }

        if user.has_capability("dashboard.view_all"):
            result["club_overview"] = {
                "members": User.objects.filter(roles__code="member", is_active=True).distinct().count(),
                "projects": Project.objects.count(),
                "events": Event.objects.count(),
                "pending_membership_requests": MembershipRequest.objects.filter(status=MembershipRequest.Status.PENDING).count(),
            }

        if user.has_capability("projects.manage_team"):
            projects = Project.objects.filter(Q(lead=user) | Q(members=user)).distinct()
            tasks = Task.objects.filter(project__in=projects)
            result["project_lead"] = {
                "projects": Project.objects.filter(lead=user).count(),
                "tasks_by_status": list(tasks.values("status").annotate(count=Count("id")).order_by("status")),
                "overdue_tasks": tasks.filter(due_date__lt=today).exclude(status=Task.Status.DONE).count(),
                "upcoming_milestone_count": Milestone.objects.filter(project__in=projects, due_date__gte=today).count(),
                "upcoming_milestones": list(projects.values("milestones__id", "milestones__title", "milestones__due_date").filter(milestones__due_date__gte=today).order_by("milestones__due_date")[:5]),
            }

        if user.has_capability("events.manage_events"):
            managed_events = Event.objects.filter(responsible=user)
            result["event_manager"] = {
                "events": managed_events.count(),
                "active_registrations": EventRegistration.objects.filter(event__in=managed_events, status=EventRegistration.Status.REGISTERED).count(),
                "capacity_remaining": sum(max(event.capacity - event.registrations.filter(status=EventRegistration.Status.REGISTERED).count(), 0) for event in managed_events.exclude(capacity__isnull=True)),
            }

        projects = Project.objects.filter(Q(lead=user) | Q(members=user)).distinct()
        assigned_tasks = Task.objects.filter(assignee=user).exclude(status=Task.Status.DONE)
        upcoming_registrations = EventRegistration.objects.filter(
            user=user,
            status=EventRegistration.Status.REGISTERED,
            event__starts_at__gte=timezone.now(),
        )
        result["member"] = {
            "project_count": projects.count(),
            "open_task_count": assigned_tasks.count(),
            "upcoming_event_count": upcoming_registrations.count(),
            "projects": list(projects.values("id", "name", "status", "due_date")[:8]),
            "tasks": list(assigned_tasks.values("id", "title", "status", "due_date", "project_id")[:8]),
            "upcoming_events": list(Event.objects.filter(
                registrations__user=user,
                registrations__status=EventRegistration.Status.REGISTERED,
                starts_at__gte=timezone.now(),
            ).values("id", "name", "starts_at", "location")[:5]),
            "unread_notifications": Notification.objects.filter(user=user, read_at__isnull=True).count(),
            "announcements": list(Announcement.objects.filter(status=Announcement.Status.PUBLISHED).filter(
                Q(audience=Announcement.Audience.PUBLIC)
                | (Q(audience=Announcement.Audience.MEMBERS) if user.is_club_member else Q(pk__in=[]))
            ).values("id", "title", "published_at")[:5]),
            "membership_requests": list(MembershipRequest.objects.filter(user=user).values("id", "status", "created_at", "decided_at")[:3]),
        }
        return Response(result)
