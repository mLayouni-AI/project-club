import gzip
import json
from collections import Counter
from datetime import datetime, timezone as datetime_timezone
from pathlib import Path

from bson import ObjectId, json_util
from django.contrib.auth.hashers import identify_hasher
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.events.models import Event, EventRegistration
from apps.members.models import MemberProfile, Role, User
from apps.projects.models import Project, ProjectMembership


BASE_DIR = Path(__file__).resolve().parents[4]


def stringify_id(value):
    return str(value) if isinstance(value, ObjectId) else str(value or "")


def normalize_datetime(value):
    if not isinstance(value, datetime):
        return None
    if timezone.is_naive(value):
        return value.replace(tzinfo=datetime_timezone.utc)
    return value


class Command(BaseCommand):
    help = "Preview or migrate useful MongoDB members, projects and events to PostgreSQL."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true", help="Commit the migration. Without this flag, only report counts.")
        parser.add_argument("--backup", type=Path, help="Required pre-migration MongoDB snapshot; defaults to the newest local snapshot.")
        parser.add_argument(
            "--confirm-legacy-admin-mapping",
            action="store_true",
            help="Confirm that legacy admin/super_admin accounts should receive club_admin privileges.",
        )

    def handle(self, *args, **options):
        backup_path = options["backup"]
        if backup_path is None:
            backups = sorted((BASE_DIR / "backups").glob("mongodb-*.json.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
            backup_path = backups[0] if backups else None
        if not backup_path or not backup_path.is_file() or backup_path.stat().st_size == 0:
            raise CommandError("A non-empty MongoDB backup is required before migration.")

        try:
            with gzip.open(backup_path, "rt", encoding="utf-8") as archive:
                snapshot = json_util.loads(archive.read())
            collections = snapshot.get("collections") if isinstance(snapshot, dict) else None
            if not isinstance(collections, dict):
                raise ValueError("Missing collections object")
            source_members = collections.get("members", [])
            source_projects = collections.get("projects", [])
            source_events = collections.get("events", [])
            if not all(isinstance(rows, list) for rows in (source_members, source_projects, source_events)):
                raise ValueError("Invalid collection data")
        except (OSError, EOFError, ValueError, TypeError) as exc:
            raise CommandError("The MongoDB snapshot could not be read; no migration was performed.") from exc

        emails = [str(doc.get("email", "")).strip().lower() for doc in source_members]
        duplicate_emails = [email for email, count in Counter(emails).items() if email and count > 1]
        compatible_hashes = 0
        incompatible_hashes = 0
        role_counts = Counter(str(doc.get("role", "")).strip().lower() or "<empty>" for doc in source_members)
        for doc in source_members:
            password_hash = doc.get("password")
            try:
                identify_hasher(password_hash)
                compatible_hashes += 1
            except (ValueError, TypeError):
                incompatible_hashes += 1

        existing = {
            "members": User.objects.filter(legacy_id__isnull=False).count(),
            "projects": Project.objects.filter(legacy_id__isnull=False).count(),
            "events": Event.objects.filter(legacy_id__isnull=False).count(),
        }
        report = {
            "mode": "apply" if options["apply"] else "dry_run",
            "backup_file": backup_path.name,
            "backup_bytes": backup_path.stat().st_size,
            "source": {"members": len(source_members), "projects": len(source_projects), "events": len(source_events)},
            "existing_legacy_rows": existing,
            "unique_member_emails": len(set(email for email in emails if email)),
            "duplicate_email_groups": len(duplicate_emails),
            "source_roles": dict(sorted(role_counts.items())),
            "compatible_password_hashes": compatible_hashes,
            "unusable_passwords_needed": incompatible_hashes,
        }
        if duplicate_emails:
            raise CommandError("Duplicate source member e-mail addresses were found; resolve them before migration.")
        unknown_roles = set(role_counts) - {"member", "admin", "super_admin"}
        if unknown_roles:
            raise CommandError("Unknown source member roles were found; map them explicitly before migration.")
        project_statuses = {"on hold", "in progress", "completed"}
        event_statuses = {"active", "cancelled", "completed"}
        if any(not doc.get("name") or str(doc.get("status", "")).strip().lower() not in project_statuses for doc in source_projects):
            raise CommandError("A source project has no name or an unmapped status; resolve it before migration.")
        if any(not doc.get("name") or str(doc.get("status", "")).strip().lower() not in event_statuses for doc in source_events):
            raise CommandError("A source event has no name or an unmapped status; resolve it before migration.")
        if not options["apply"]:
            self.stdout.write(json.dumps(report, sort_keys=True))
            return

        if role_counts.keys() & {"admin", "super_admin"} and not options["confirm_legacy_admin_mapping"]:
            raise CommandError("Legacy admin accounts map to club_admin; pass --confirm-legacy-admin-mapping only after this privilege mapping is approved.")

        if any(not doc.get("email") or not doc.get("first_name") or not doc.get("last_name") for doc in source_members):
            raise CommandError("A source member is missing a required identity field; no rows were migrated.")
        if any(not stringify_id(doc.get("_id")) for doc in source_members + source_projects + source_events):
            raise CommandError("A source row has no legacy ID; resolve it before migration.")
        source_ids = {
            "members": [stringify_id(doc["_id"]) for doc in source_members],
            "projects": [stringify_id(doc["_id"]) for doc in source_projects],
            "events": [stringify_id(doc["_id"]) for doc in source_events],
        }
        if any(len(ids) != len(set(ids)) for ids in source_ids.values()):
            raise CommandError("The snapshot contains duplicate legacy IDs; resolve them before migration.")

        migrated = {"members": 0, "projects": 0, "events": 0, "project_memberships": 0, "event_registrations": 0, "missing_references": 0, "unusable_passwords": 0}
        member_map = {}
        try:
            with transaction.atomic():
                for doc in source_members:
                    old_id = stringify_id(doc.get("_id"))
                    password_hash = doc.get("password")
                    try:
                        identify_hasher(password_hash)
                    except (ValueError, TypeError):
                        password_hash = "!"
                        migrated["unusable_passwords"] += 1
                    joined_at = normalize_datetime(doc.get("date_of_joining"))
                    email = str(doc["email"]).strip().lower()
                    role_code = str(doc.get("role", "")).strip().lower()
                    role_codes = ["member"] if role_code == "member" else ["member", "club_admin"] if role_code in {"admin", "super_admin"} else []
                    first_name = str(doc["first_name"]).strip()
                    last_name = str(doc["last_name"]).strip()
                    user = User.objects.filter(legacy_id=old_id).first()
                    if user:
                        try:
                            identify_hasher(doc.get("password"))
                            password_matches = user.password == doc.get("password")
                        except (ValueError, TypeError):
                            password_matches = not user.has_usable_password()
                        profile = MemberProfile.objects.filter(user=user).first()
                        actual_roles = set(user.roles.values_list("code", flat=True))
                        if (
                            user.email != email
                            or user.first_name != first_name
                            or user.last_name != last_name
                            or not user.is_active
                            or user.is_superuser
                            or (joined_at and user.date_joined != joined_at)
                            or not password_matches
                            or actual_roles != set(role_codes)
                            or not profile
                            or profile.joined_at != joined_at
                        ):
                            raise ValueError("An existing legacy member differs from the snapshot.")
                    else:
                        if User.objects.filter(email__iexact=email).exists():
                            raise ValueError("A source member e-mail already belongs to another account.")
                        user = User.objects.create(
                            legacy_id=old_id,
                            email=email,
                            first_name=first_name,
                            last_name=last_name,
                            password=password_hash,
                            is_active=True,
                            date_joined=joined_at or timezone.now(),
                        )
                        if password_hash == "!":
                            user.set_unusable_password()
                            user.save(update_fields=("password",))
                        roles = Role.objects.filter(code__in=role_codes)
                        if set(roles.values_list("code", flat=True)) != set(role_codes):
                            raise ValueError("A mapped application role is unavailable.")
                        user.roles.set(roles)
                        MemberProfile.objects.create(user=user, joined_at=joined_at)
                    member_map[old_id] = user
                    migrated["members"] += 1

                old_project_status = {"on hold": Project.Status.SUSPENDED, "in progress": Project.Status.IN_PROGRESS, "completed": Project.Status.COMPLETED}
                for doc in source_projects:
                    old_id = stringify_id(doc.get("_id"))
                    legacy_status = str(doc.get("status", "on hold")).strip().lower()
                    name = str(doc["name"])[:200]
                    description = str(doc.get("description") or "")
                    project_status = old_project_status[legacy_status]
                    project = Project.objects.filter(legacy_id=old_id).first()
                    if project:
                        if project.name != name or project.description != description or project.status != project_status or project.is_public:
                            raise ValueError("An existing legacy project differs from the snapshot.")
                    else:
                        project = Project.objects.create(
                            legacy_id=old_id,
                            name=name,
                            description=description,
                            status=project_status,
                            is_public=False,
                        )
                    migrated["projects"] += 1
                    for old_member_id in doc.get("team_members", []):
                        user = member_map.get(stringify_id(old_member_id)) or User.objects.filter(legacy_id=stringify_id(old_member_id)).first()
                        if not user:
                            migrated["missing_references"] += 1
                            continue
                        ProjectMembership.objects.get_or_create(project=project, user=user)
                        migrated["project_memberships"] += 1

                old_event_status = {"active": Event.Status.PUBLISHED, "cancelled": Event.Status.CANCELLED, "completed": Event.Status.COMPLETED}
                for doc in source_events:
                    old_id = stringify_id(doc.get("_id"))
                    event_values = {
                        "name": str(doc["name"])[:200],
                        "description": str(doc.get("description") or ""),
                        "location": str(doc.get("location") or "")[:200],
                        "starts_at": normalize_datetime(doc.get("date_start")),
                        "ends_at": normalize_datetime(doc.get("date_end")),
                        "status": old_event_status[str(doc["status"]).strip().lower()],
                        "audience": Event.Audience.PUBLIC,
                        "capacity": None,
                    }
                    event = Event.objects.filter(legacy_id=old_id).first()
                    if event:
                        if any(getattr(event, field) != value for field, value in event_values.items()):
                            raise ValueError("An existing legacy event differs from the snapshot.")
                    else:
                        event = Event.objects.create(legacy_id=old_id, **event_values)
                    migrated["events"] += 1
                    for old_member_id in doc.get("participants", []):
                        user = member_map.get(stringify_id(old_member_id)) or User.objects.filter(legacy_id=stringify_id(old_member_id)).first()
                        if not user:
                            migrated["missing_references"] += 1
                            continue
                        EventRegistration.objects.get_or_create(event=event, user=user)
                        migrated["event_registrations"] += 1
                verification_mismatches = 0
                for doc in source_members:
                    old_id = stringify_id(doc.get("_id"))
                    user = User.objects.get(legacy_id=old_id)
                    expected_password = doc.get("password")
                    expected_roles = {"member"} if str(doc.get("role", "")).strip().lower() == "member" else {"member", "club_admin"}
                    actual_roles = set(user.roles.values_list("code", flat=True))
                    identity_matches = (
                        user.email == str(doc["email"]).strip().lower()
                        and user.first_name == str(doc["first_name"]).strip()
                        and user.last_name == str(doc["last_name"]).strip()
                    )
                    try:
                        identify_hasher(expected_password)
                        password_matches = user.password == expected_password
                    except (ValueError, TypeError):
                        password_matches = not user.has_usable_password()
                    profile = MemberProfile.objects.get(user=user)
                    if not identity_matches or not password_matches or actual_roles != expected_roles or profile.joined_at != normalize_datetime(doc.get("date_of_joining")):
                        verification_mismatches += 1
                if verification_mismatches:
                    raise ValueError("Imported member verification failed.")
            report["migrated"] = migrated
            report["verification"] = {
                "members": User.objects.filter(legacy_id__in=source_ids["members"]).count(),
                "projects": Project.objects.filter(legacy_id__in=source_ids["projects"]).count(),
                "events": Event.objects.filter(legacy_id__in=source_ids["events"]).count(),
                "member_mismatches": verification_mismatches,
            }
        except Exception as exc:
            raise CommandError("The migration failed and its PostgreSQL transaction was rolled back. MongoDB remains unchanged.") from exc

        self.stdout.write(json.dumps(report, sort_keys=True))
