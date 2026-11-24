from django.contrib import admin
from django.urls import include, path
from rest_framework import permissions
from drf_yasg import openapi
from drf_yasg.views import get_schema_view

from apps.members.dashboard import DashboardView

schema_view = get_schema_view(
    openapi.Info(title="MyClub API", default_version="v1", description="API REST de gestion du Club DIA."),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.members.urls")),
    path("api/v1/", include("apps.projects.urls")),
    path("api/v1/", include("apps.events.urls")),
    path("api/v1/", include("apps.announcements.urls")),
    path("api/v1/dashboard/summary/", DashboardView.as_view(), name="dashboard-summary"),
    path("api/v1/docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("api/v1/openapi.json", schema_view.without_ui(cache_timeout=0), name="schema-json"),
]
