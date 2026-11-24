from django.db import migrations


ROLES = {
    "visitor": "Visiteur",
    "member": "Membre",
    "club_admin": "Administrateur du club",
    "project_lead": "Chef de projet",
    "president": "Président du club",
    "event_manager": "Responsable des événements",
    "pedagogical_supervisor": "Encadrant pédagogique",
    "communications_manager": "Responsable de la communication",
}

CAPABILITIES = {
    "members.view_members": "Consulter le répertoire des membres",
    "members.manage_members": "Gérer les comptes et membres",
    "members.review_membership": "Traiter les demandes d'adhésion",
    "members.manage_roles": "Attribuer les rôles métier",
    "projects.view_projects": "Consulter les projets autorisés",
    "projects.propose_project": "Proposer un projet",
    "projects.manage_projects": "Gérer les projets du club",
    "projects.manage_team": "Gérer une équipe de projet",
    "projects.manage_tasks": "Gérer les tâches attribuées",
    "projects.review_deliverables": "Examiner les livrables attribués",
    "events.view_events": "Consulter les événements autorisés",
    "events.manage_events": "Gérer les événements attribués",
    "events.manage_attendance": "Gérer les présences attribuées",
    "announcements.view_member": "Consulter les annonces membres",
    "announcements.manage_announcements": "Gérer les annonces",
    "audit.view_audit": "Consulter le journal d'audit",
    "dashboard.view_all": "Consulter les indicateurs globaux",
}

ROLE_CAPABILITIES = {
    "visitor": ("events.view_events",),
    "member": ("projects.view_projects", "projects.propose_project", "events.view_events", "announcements.view_member"),
    "club_admin": tuple(CAPABILITIES),
    "project_lead": ("projects.view_projects", "projects.propose_project", "projects.manage_team", "projects.manage_tasks", "projects.review_deliverables"),
    "president": ("projects.view_projects", "events.view_events", "announcements.view_member", "audit.view_audit", "dashboard.view_all"),
    "event_manager": ("events.view_events", "events.manage_events", "events.manage_attendance", "announcements.view_member"),
    "pedagogical_supervisor": ("projects.view_projects", "projects.review_deliverables"),
    "communications_manager": ("announcements.view_member", "announcements.manage_announcements"),
}


def seed(apps, schema_editor):
    Role = apps.get_model("members", "Role")
    Capability = apps.get_model("members", "Capability")
    RoleCapability = apps.get_model("members", "RoleCapability")
    roles = {code: Role.objects.update_or_create(code=code, defaults={"name": name})[0] for code, name in ROLES.items()}
    capabilities = {
        code: Capability.objects.update_or_create(code=code, defaults={"label": label})[0]
        for code, label in CAPABILITIES.items()
    }
    for role_code, codes in ROLE_CAPABILITIES.items():
        role = roles[role_code]
        RoleCapability.objects.filter(role=role).exclude(capability__code__in=codes).delete()
        for capability_code in codes:
            RoleCapability.objects.get_or_create(role=role, capability=capabilities[capability_code])


def unseed(apps, schema_editor):
    Role = apps.get_model("members", "Role")
    Capability = apps.get_model("members", "Capability")
    Role.objects.filter(code__in=ROLES).delete()
    Capability.objects.filter(code__in=CAPABILITIES).delete()


class Migration(migrations.Migration):
    dependencies = [("members", "0001_initial")]
    operations = [migrations.RunPython(seed, unseed)]
