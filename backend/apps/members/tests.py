import gzip
from io import StringIO
import tempfile
from datetime import timedelta
from pathlib import Path

from bson import ObjectId, json_util
from django.contrib.auth.hashers import make_password
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.core.management.base import CommandError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.announcements.models import Announcement, Notification
from apps.events.models import Attendance, Event, EventRegistration
from apps.members.models import AuditLog, MemberProfile, MembershipRequest, Role, User
from apps.projects.models import Milestone, Project, ProjectMembership, Task


class MyClubAPITests(APITestCase):
    def make_user(self, email, role="member", password="club-test-password-91!"):
        user = User.objects.create_user(email=email, password=password, first_name="Test", last_name="User")
        user.roles.add(Role.objects.get(code=role))
        MemberProfile.objects.create(user=user)
        return user

    def authenticate(self, user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    def write_mongo_snapshot(self, directory, collections):
        path = Path(directory) / "mongo-snapshot.json.gz"
        with gzip.open(path, "wt", encoding="utf-8") as archive:
            archive.write(json_util.dumps({"database": "clubsite_db", "collections": collections}))
        return path

    def test_signup_login_refresh_and_logout_do_not_expose_password_hash(self):
        signup = self.client.post("/api/v1/auth/signup/", {
            "first_name": "Ada",
            "last_name": "Test",
            "email": "ada@example.test",
            "password": "copper-orbit-garden-917!",
            "confirm_password": "copper-orbit-garden-917!",
        }, format="json")
        self.assertEqual(signup.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("password", signup.data["user"])
        user = User.objects.get(email="ada@example.test")
        self.assertTrue(user.check_password("copper-orbit-garden-917!"))
        self.assertEqual(list(user.roles.values_list("code", flat=True)), ["visitor"])

        login = self.client.post("/api/v1/auth/login/", {
            "email": user.email,
            "password": "copper-orbit-garden-917!",
        }, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn("access", login.data)
        self.assertNotIn("password", login.data["user"])

        refreshed = self.client.post("/api/v1/auth/refresh/", {"refresh": login.data["refresh"]}, format="json")
        self.assertEqual(refreshed.status_code, status.HTTP_200_OK)
        self.assertIn("access", refreshed.data)
        self.assertIn("refresh", refreshed.data)

        logout = self.client.post("/api/v1/auth/logout/", {"refresh": refreshed.data["refresh"]}, format="json")
        self.assertEqual(logout.status_code, status.HTTP_200_OK)

    def test_protected_member_list_and_role_capability(self):
        member = self.make_user("member@example.test")
        self.assertEqual(self.client.get("/api/v1/members/").status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.authenticate(member).get("/api/v1/members/").status_code, status.HTTP_403_FORBIDDEN)

        admin = self.make_user("admin@example.test", role="club_admin")
        response = self.authenticate(admin).get("/api/v1/members/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("password", response.data["results"][0])

    def test_membership_review_assigns_member_role_and_creates_audit_and_notification(self):
        applicant = self.make_user("applicant@example.test", role="visitor")
        admin = self.make_user("reviewer@example.test", role="club_admin")
        applicant_client = self.authenticate(applicant)
        created = applicant_client.post("/api/v1/membership-requests/", {"message": "Je souhaite participer aux ateliers."}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)

        reviewed = self.authenticate(admin).post(
            f"/api/v1/membership-requests/{created.data['id']}/review/",
            {"status": "approved", "decision_note": "Bienvenue."},
            format="json",
        )
        self.assertEqual(reviewed.status_code, status.HTTP_200_OK)
        self.assertEqual(reviewed.data["status"], MembershipRequest.Status.APPROVED)
        self.assertTrue(applicant.roles.filter(code="member").exists())
        self.assertFalse(applicant.roles.filter(code="visitor").exists())
        self.assertTrue(Notification.objects.filter(user=applicant).exists())
        self.assertTrue(AuditLog.objects.filter(action="membership.reviewed").exists())

    def test_member_project_proposal_is_private_but_visible_to_its_author(self):
        member = self.make_user("proposer@example.test")
        client = self.authenticate(member)
        response = client.post("/api/v1/projects/", {
            "name": "Projet de démonstration",
            "description": "Une proposition réelle.",
            "domain": "ai",
            "status": "in_progress",
            "is_public": True,
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["status"], Project.Status.PROPOSED)
        self.assertFalse(response.data["is_public"])
        self.assertEqual(client.get(f"/api/v1/projects/{response.data['id']}/").status_code, status.HTTP_200_OK)
        self.assertEqual(client.get("/api/v1/projects/").data["count"], 1)

    def test_authenticated_project_list_hides_public_proposals_until_approved(self):
        viewer = self.make_user("project-viewer@example.test")
        manager = self.make_user("project-manager@example.test", role="club_admin")
        proposal = Project.objects.create(
            name="Proposition en attente",
            created_by=manager,
            is_public=True,
            status=Project.Status.PROPOSED,
        )
        published = Project.objects.create(
            name="Projet publié",
            created_by=manager,
            is_public=True,
            status=Project.Status.APPROVED,
        )

        client = self.authenticate(viewer)
        response = client.get("/api/v1/projects/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = {project["id"] for project in response.data["results"]}
        self.assertNotIn(proposal.pk, ids)
        self.assertIn(published.pk, ids)
        self.assertEqual(client.get(f"/api/v1/projects/{proposal.pk}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_all_eight_roles_enforce_their_current_api_capability_matrix(self):
        expected_access = {
            "visitor": set(),
            "member": {"projects"},
            "club_admin": {"members", "audit", "membership_review", "projects", "events", "announcements"},
            "project_lead": {"projects"},
            "president": {"audit"},
            "event_manager": {"events"},
            "pedagogical_supervisor": set(),
            "communications_manager": {"announcements"},
        }
        for index, (role_code, expected) in enumerate(expected_access.items()):
            with self.subTest(role=role_code):
                user = self.make_user(f"role-{index}@example.test", role=role_code)
                client = self.authenticate(user)

                self.assertEqual(client.get("/api/v1/members/").status_code == status.HTTP_200_OK, "members" in expected)
                self.assertEqual(client.get("/api/v1/audit-logs/").status_code == status.HTTP_200_OK, "audit" in expected)

                announcement = client.post("/api/v1/announcements/", {
                    "title": f"Annonce {role_code}",
                    "content": "Texte de validation des permissions.",
                }, format="json")
                self.assertEqual(announcement.status_code == status.HTTP_201_CREATED, "announcements" in expected)

                event = client.post("/api/v1/events/", {"name": f"Événement {role_code}"}, format="json")
                self.assertEqual(event.status_code == status.HTTP_201_CREATED, "events" in expected)

                project = client.post("/api/v1/projects/", {"name": f"Projet {role_code}"}, format="json")
                self.assertEqual(project.status_code == status.HTTP_201_CREATED, "projects" in expected)

                role_applicant = self.make_user(f"role-applicant-{index}@example.test", role="visitor")
                request = MembershipRequest.objects.create(user=role_applicant, message=f"Demande revue par {role_code}.")
                review = client.post(
                    f"/api/v1/membership-requests/{request.pk}/review/",
                    {"status": "rejected"},
                    format="json",
                )
                self.assertEqual(review.status_code == status.HTTP_200_OK, "membership_review" in expected)

    def test_superuser_is_reported_to_the_frontend_and_can_use_admin_endpoints(self):
        superuser = User.objects.create_superuser(email="superuser@example.test", password="strong-test-password-94!")
        login = self.client.post("/api/v1/auth/login/", {
            "email": superuser.email,
            "password": "strong-test-password-94!",
        }, format="json")
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertTrue(login.data["user"]["is_superuser"])
        response = self.authenticate(superuser).get("/api/v1/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_superuser"])
        self.assertEqual(self.authenticate(superuser).get("/api/v1/members/").status_code, status.HTTP_200_OK)

    def test_event_managers_cannot_delegate_or_remove_their_responsibility(self):
        manager = self.make_user("event-manager@example.test", role="event_manager")
        another_manager = self.make_user("second-event-manager@example.test", role="event_manager")
        client = self.authenticate(manager)

        denied = client.post("/api/v1/events/", {
            "name": "Atelier délégué",
            "responsible": another_manager.pk,
        }, format="json")
        self.assertEqual(denied.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Event.objects.filter(name="Atelier délégué").exists())

        created = client.post("/api/v1/events/", {"name": "Atelier du responsable"}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        self.assertEqual(created.data["responsible"], manager.pk)

        changed = client.patch(f"/api/v1/events/{created.data['id']}/", {"responsible": another_manager.pk}, format="json")
        self.assertEqual(changed.status_code, status.HTTP_403_FORBIDDEN)
        cleared = client.patch(f"/api/v1/events/{created.data['id']}/", {"responsible": None}, format="json")
        self.assertEqual(cleared.status_code, status.HTTP_403_FORBIDDEN)

        administrator = self.make_user("event-admin@example.test", role="club_admin")
        delegated = self.authenticate(administrator).post("/api/v1/events/", {
            "name": "Atelier confié",
            "responsible": another_manager.pk,
        }, format="json")
        self.assertEqual(delegated.status_code, status.HTTP_201_CREATED)
        self.assertEqual(delegated.data["responsible"], another_manager.pk)

    def test_project_detail_team_milestone_comment_and_relation_flows(self):
        lead = self.make_user("detail-lead@example.test", role="project_lead")
        member = self.make_user("detail-member@example.test")
        other_lead = self.make_user("detail-other-lead@example.test", role="project_lead")
        project = Project.objects.create(name="Projet avec détail", lead=lead, created_by=lead)
        ProjectMembership.objects.create(project=project, user=lead, role=ProjectMembership.Role.LEAD)
        other_project = Project.objects.create(name="Autre projet", lead=other_lead, created_by=other_lead)
        client = self.authenticate(lead)

        candidates = client.get("/api/v1/project-memberships/candidates/", {"project": project.pk})
        self.assertEqual(candidates.status_code, status.HTTP_200_OK)
        self.assertIn(member.get_full_name(), [candidate["full_name"] for candidate in candidates.data["results"]])
        self.assertEqual(self.authenticate(member).get("/api/v1/project-memberships/candidates/", {"project": project.pk}).status_code, status.HTTP_403_FORBIDDEN)

        visitor = self.make_user("detail-visitor@example.test", role="visitor")
        rejected_visitor = client.post("/api/v1/project-memberships/", {
            "project": project.pk,
            "user": visitor.pk,
            "role": "member",
        }, format="json")
        self.assertEqual(rejected_visitor.status_code, status.HTTP_400_BAD_REQUEST)

        added = client.post("/api/v1/project-memberships/", {
            "project": project.pk,
            "user": member.pk,
            "role": "member",
        }, format="json")
        self.assertEqual(added.status_code, status.HTTP_201_CREATED)
        self.assertEqual(added.data["user_name"], member.get_full_name())

        milestone = client.post("/api/v1/milestones/", {
            "project": project.pk,
            "title": "Version bêta",
        }, format="json")
        self.assertEqual(milestone.status_code, status.HTTP_201_CREATED)
        completed = client.post(f"/api/v1/milestones/{milestone.data['id']}/complete/", {}, format="json")
        self.assertTrue(completed.data["completed_at"])
        reopened = client.post(f"/api/v1/milestones/{milestone.data['id']}/reopen/", {}, format="json")
        self.assertIsNone(reopened.data["completed_at"])

        task = client.post("/api/v1/tasks/", {
            "project": project.pk,
            "title": "Écrire les tests",
            "assignee": member.pk,
        }, format="json")
        self.assertEqual(task.status_code, status.HTTP_201_CREATED)
        comment = client.post(f"/api/v1/tasks/{task.data['id']}/comments/", {"content": "Première étape réalisée."}, format="json")
        self.assertEqual(comment.status_code, status.HTTP_201_CREATED)
        self.assertEqual(comment.data["task"], task.data["id"])

        foreign_milestone = Milestone.objects.create(project=other_project, title="Jalon extérieur")
        bad_task = client.post("/api/v1/tasks/", {
            "project": project.pk,
            "milestone": foreign_milestone.pk,
            "title": "Tâche mal liée",
        }, format="json")
        self.assertEqual(bad_task.status_code, status.HTTP_400_BAD_REQUEST)

        foreign_task = Task.objects.create(project=other_project, title="Tâche extérieure", created_by=other_lead)
        bad_file = client.post("/api/v1/project-files/", {
            "project": project.pk,
            "task": foreign_task.pk,
            "file": SimpleUploadedFile("livrable.pdf", b"%PDF-1.7 test", content_type="application/pdf"),
        }, format="multipart")
        self.assertEqual(bad_file.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("task", bad_file.data)

    def test_mongo_import_reads_the_snapshot_and_is_idempotent_without_overwriting(self):
        joined_at = timezone.now()
        member_id = ObjectId()
        source_member = {
            "_id": member_id,
            "first_name": "Samira",
            "last_name": "Benali",
            "email": "samira@example.test",
            "password": make_password("safe-test-password-927!"),
            "role": "member",
            "date_of_joining": joined_at,
        }
        with tempfile.TemporaryDirectory() as directory:
            snapshot = self.write_mongo_snapshot(directory, {"members": [source_member], "projects": [], "events": []})
            call_command("migrate_from_mongodb", backup=snapshot, apply=True, stdout=StringIO())
            user = User.objects.get(legacy_id=str(member_id))
            updated_at = user.updated_at
            self.assertEqual(user.email, "samira@example.test")
            self.assertTrue(user.check_password("safe-test-password-927!"))
            self.assertEqual(set(user.roles.values_list("code", flat=True)), {"member"})

            call_command("migrate_from_mongodb", backup=snapshot, apply=True, stdout=StringIO())
            user.refresh_from_db()
            self.assertEqual(user.updated_at, updated_at)
            self.assertEqual(User.objects.filter(legacy_id=str(member_id)).count(), 1)

    def test_mongo_import_refuses_to_overwrite_an_existing_email(self):
        existing = self.make_user("existing@example.test")
        source_member = {
            "_id": ObjectId(),
            "first_name": "Different",
            "last_name": "Person",
            "email": existing.email,
            "password": make_password("another-test-password-28!"),
            "role": "member",
        }
        with tempfile.TemporaryDirectory() as directory:
            snapshot = self.write_mongo_snapshot(directory, {"members": [source_member], "projects": [], "events": []})
            with self.assertRaises(CommandError):
                call_command("migrate_from_mongodb", backup=snapshot, apply=True, stdout=StringIO())
        existing.refresh_from_db()
        self.assertEqual(existing.first_name, "Test")
        self.assertFalse(User.objects.filter(legacy_id=str(source_member["_id"])).exists())

    def test_mongo_import_requires_explicit_approval_for_legacy_admin_privileges(self):
        source_member = {
            "_id": ObjectId(),
            "first_name": "Legacy",
            "last_name": "Admin",
            "email": "legacy-admin@example.test",
            "password": make_password("legacy-test-password-720!"),
            "role": "admin",
        }
        with tempfile.TemporaryDirectory() as directory:
            snapshot = self.write_mongo_snapshot(directory, {"members": [source_member], "projects": [], "events": []})
            with self.assertRaises(CommandError):
                call_command("migrate_from_mongodb", backup=snapshot, apply=True, stdout=StringIO())
        self.assertFalse(User.objects.filter(email="legacy-admin@example.test").exists())

    def test_project_tasks_are_limited_to_project_members(self):
        lead = self.make_user("lead@example.test", role="project_lead")
        outsider = self.make_user("outsider@example.test")
        project = Project.objects.create(name="Équipe", lead=lead, created_by=lead)
        ProjectMembership.objects.create(project=project, user=lead, role=ProjectMembership.Role.LEAD)
        task_response = self.authenticate(lead).post("/api/v1/tasks/", {
            "project": project.pk,
            "title": "Préparer le prototype",
            "status": "todo",
        }, format="json")
        self.assertEqual(task_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(self.authenticate(outsider).get("/api/v1/tasks/").data["count"], 0)
        self.assertEqual(self.authenticate(outsider).get(f"/api/v1/tasks/{task_response.data['id']}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_event_capacity_is_enforced_and_cancel_releases_a_seat(self):
        manager = self.make_user("events@example.test", role="event_manager")
        first = self.make_user("first@example.test")
        second = self.make_user("second@example.test", role="visitor")
        event = Event.objects.create(
            name="Atelier IA",
            starts_at=timezone.now() + timedelta(days=5),
            capacity=1,
            responsible=manager,
            status=Event.Status.PUBLISHED,
        )

        first_client = self.authenticate(first)
        registration = first_client.post(f"/api/v1/events/{event.pk}/register/", {}, format="json")
        self.assertEqual(registration.status_code, status.HTTP_201_CREATED)
        event.refresh_from_db()
        self.assertEqual(event.status, Event.Status.FULL)
        self.assertEqual(EventRegistration.objects.filter(event=event, status=EventRegistration.Status.REGISTERED).count(), 1)

        rejected = self.authenticate(second).post(f"/api/v1/events/{event.pk}/register/", {}, format="json")
        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(EventRegistration.objects.filter(event=event, status=EventRegistration.Status.REGISTERED).count(), 1)

        cancelled = first_client.post(f"/api/v1/events/{event.pk}/cancel_registration/", {}, format="json")
        self.assertEqual(cancelled.status_code, status.HTTP_204_NO_CONTENT)
        event.refresh_from_db()
        self.assertEqual(event.status, Event.Status.PUBLISHED)
        self.assertEqual(self.authenticate(second).post(f"/api/v1/events/{event.pk}/register/", {}, format="json").status_code, status.HTTP_201_CREATED)

    def test_attendance_updates_existing_record_instead_of_duplicating(self):
        manager = self.make_user("attendance@example.test", role="event_manager")
        participant = self.make_user("participant@example.test")
        event = Event.objects.create(name="Rencontre", responsible=manager, status=Event.Status.PUBLISHED)
        EventRegistration.objects.create(event=event, user=participant)
        client = self.authenticate(manager)

        first = client.post(f"/api/v1/events/{event.pk}/attendance/", {"user": participant.pk, "status": "present"}, format="json")
        second = client.post(f"/api/v1/events/{event.pk}/attendance/", {"user": participant.pk, "status": "absent"}, format="json")
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(Attendance.objects.filter(event=event, user=participant).count(), 1)
        self.assertEqual(Attendance.objects.get(event=event, user=participant).status, Attendance.Status.ABSENT)

        # Test participant CSV export with permissions
        export_resp = client.get(f"/api/v1/events/{event.pk}/export_participants/")
        self.assertEqual(export_resp.status_code, status.HTTP_200_OK)
        self.assertIn("text/csv", export_resp.headers["Content-Type"])
        content = b"".join(export_resp.streaming_content).decode("utf-8")
        self.assertIn("id,nom_complet,email,date_inscription,presence", content)
        self.assertIn("participant@example.test", content)

        outsider = self.make_user("outsider-event@example.test")
        outsider_resp = self.authenticate(outsider).get(f"/api/v1/events/{event.pk}/export_participants/")
        self.assertEqual(outsider_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_announcement_visibility_follows_audience_and_publication(self):
        author = self.make_user("publisher@example.test", role="communications_manager")
        member = self.make_user("reader@example.test")
        Announcement.objects.create(title="Public", content="Visible", author=author, audience="public", status="published", published_at=timezone.now())
        Announcement.objects.create(title="Membres", content="Réservée", author=author, audience="members", status="published", published_at=timezone.now())
        Announcement.objects.create(title="Brouillon", content="Non publiée", author=author, audience="public", status="draft")

        public = self.client.get("/api/v1/announcements/")
        member_response = self.authenticate(member).get("/api/v1/announcements/")
        self.assertEqual(public.status_code, status.HTTP_200_OK)
        self.assertEqual({item["title"] for item in public.data["results"]}, {"Public"})
        self.assertEqual({item["title"] for item in member_response.data["results"]}, {"Public", "Membres"})

    def test_publishing_a_member_announcement_notifies_members_only(self):
        author = self.make_user("comms@example.test", role="communications_manager")
        member = self.make_user("announcement-member@example.test")
        visitor = self.make_user("announcement-visitor@example.test", role="visitor")
        client = self.authenticate(author)
        created = client.post("/api/v1/announcements/", {
            "title": "Atelier à venir",
            "content": "Inscription ouverte.",
            "audience": "members",
        }, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        published = client.post(f"/api/v1/announcements/{created.data['id']}/publish/", {}, format="json")
        self.assertEqual(published.status_code, status.HTTP_200_OK)
        self.assertTrue(Notification.objects.filter(user=member, resource_type="announcement").exists())
        self.assertFalse(Notification.objects.filter(user=visitor, resource_type="announcement").exists())
        self.assertFalse(Notification.objects.filter(user=author, resource_type="announcement").exists())

    def test_notifications_are_scoped_to_the_authenticated_user(self):
        first = self.make_user("notice-one@example.test")
        second = self.make_user("notice-two@example.test")
        Notification.objects.create(user=first, title="À moi", message="Message privé")
        Notification.objects.create(user=second, title="À l'autre membre", message="Autre message")

        response = self.authenticate(first).get("/api/v1/notifications/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["title"] for item in response.data["results"]], ["À moi"])
