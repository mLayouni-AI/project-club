from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    MilestoneViewSet,
    ProjectFileViewSet,
    ProjectMembershipViewSet,
    ProjectViewSet,
    TaskCommentViewSet,
    TaskViewSet,
)

router = DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")
router.register("tasks", TaskViewSet, basename="task")
router.register("milestones", MilestoneViewSet, basename="milestone")
router.register("project-memberships", ProjectMembershipViewSet, basename="project-membership")
router.register("task-comments", TaskCommentViewSet, basename="task-comment")
router.register("project-files", ProjectFileViewSet, basename="project-file")

urlpatterns = [path("", include(router.urls))]
