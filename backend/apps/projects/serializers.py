from rest_framework import serializers

from .models import Milestone, Project, ProjectFile, ProjectMembership, Task, TaskComment


class ProjectMembershipSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = ProjectMembership
        fields = ("id", "user", "user_name", "role", "joined_at")
        read_only_fields = ("id", "joined_at", "user_name")


class ProjectSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source="memberships.count", read_only=True)
    task_count = serializers.IntegerField(source="tasks.count", read_only=True)
    lead_name = serializers.CharField(source="lead.get_full_name", read_only=True)

    class Meta:
        model = Project
        fields = (
            "id", "name", "description", "problem", "objectives", "domain", "priority", "status",
            "lead", "lead_name", "created_by", "start_date", "due_date", "is_public", "github_url",
            "external_links", "member_count", "task_count", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_by", "lead_name", "member_count", "task_count", "created_at", "updated_at")


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ("id", "project", "title", "description", "due_date", "completed_at", "created_at", "updated_at")
        read_only_fields = ("id", "completed_at", "created_at", "updated_at")


class TaskSerializer(serializers.ModelSerializer):
    assignee_name = serializers.CharField(source="assignee.get_full_name", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    overdue = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id", "project", "project_name", "milestone", "title", "description", "status", "priority",
            "assignee", "assignee_name", "created_by", "due_date", "overdue", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_by", "assignee_name", "project_name", "overdue", "created_at", "updated_at")

    def validate(self, attrs):
        project = attrs.get("project", getattr(self.instance, "project", None))
        milestone = attrs.get("milestone", getattr(self.instance, "milestone", None))
        if milestone and project and milestone.project_id != project.pk:
            raise serializers.ValidationError({"milestone": "Le jalon doit appartenir au même projet que la tâche."})
        return attrs

    def get_overdue(self, task):
        from django.utils import timezone

        return bool(task.due_date and task.due_date < timezone.localdate() and task.status != Task.Status.DONE)


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.get_full_name", read_only=True)

    class Meta:
        model = TaskComment
        fields = ("id", "task", "author", "author_name", "content", "created_at", "updated_at")
        read_only_fields = ("id", "task", "author", "author_name", "created_at", "updated_at")


class ProjectFileSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)
    file = serializers.FileField(write_only=True, required=True)

    class Meta:
        model = ProjectFile
        fields = ("id", "project", "task", "file", "original_name", "content_type", "size", "uploaded_by_name", "created_at")
        read_only_fields = ("id", "original_name", "content_type", "size", "uploaded_by_name", "created_at")

    def validate(self, attrs):
        project = attrs.get("project")
        task = attrs.get("task")
        if task and project and task.project_id != project.pk:
            raise serializers.ValidationError({"task": "La tâche doit appartenir au même projet que le fichier."})
        return attrs

    def validate_file(self, uploaded_file):
        allowed_types = {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".csv": "text/csv",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
        import os

        extension = os.path.splitext(uploaded_file.name)[1].lower()
        expected_type = allowed_types.get(extension)
        if not expected_type or uploaded_file.content_type != expected_type:
            raise serializers.ValidationError("Type de fichier non autorisé.")
        if uploaded_file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("La taille maximale autorisée est de 10 Mo.")
        import zipfile

        try:
            uploaded_file.seek(0)
            header = uploaded_file.read(16)
            uploaded_file.seek(0)
            if extension == ".pdf" and not header.startswith(b"%PDF-"):
                raise serializers.ValidationError("Le contenu ne correspond pas à un PDF.")
            if extension == ".png" and not header.startswith(b"\x89PNG\r\n\x1a\n"):
                raise serializers.ValidationError("Le contenu ne correspond pas à une image PNG.")
            if extension in {".jpg", ".jpeg"} and not header.startswith(b"\xff\xd8\xff"):
                raise serializers.ValidationError("Le contenu ne correspond pas à une image JPEG.")
            if extension == ".csv":
                content = uploaded_file.read(64 * 1024)
                if b"\x00" in content:
                    raise serializers.ValidationError("Le contenu du fichier CSV n'est pas valide.")
                content.decode("utf-8-sig")
            if extension in {".docx", ".xlsx"}:
                with zipfile.ZipFile(uploaded_file) as archive:
                    required_member = "word/document.xml" if extension == ".docx" else "xl/workbook.xml"
                    if "[Content_Types].xml" not in archive.namelist() or required_member not in archive.namelist():
                        raise serializers.ValidationError("Le contenu ne correspond pas au type de document annoncé.")
        except serializers.ValidationError:
            raise
        except (UnicodeDecodeError, zipfile.BadZipFile, OSError, ValueError) as exc:
            raise serializers.ValidationError("Le contenu du fichier n'est pas valide.") from exc
        finally:
            uploaded_file.seek(0)
        return uploaded_file

    def create(self, validated_data):
        uploaded_file = validated_data["file"]
        validated_data.setdefault("original_name", uploaded_file.name[:255])
        validated_data.setdefault("content_type", uploaded_file.content_type[:120])
        validated_data.setdefault("size", uploaded_file.size)
        return super().create(validated_data)
