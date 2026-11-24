
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.db.models import Q
from django.utils import timezone


class Capability(models.Model):
    code = models.CharField(max_length=80, unique=True)
    label = models.CharField(max_length=120)

    class Meta:
        ordering = ("code",)

    def __str__(self):
        return self.code


class Role(models.Model):
    code = models.SlugField(max_length=40, unique=True)
    name = models.CharField(max_length=100)
    capabilities = models.ManyToManyField(Capability, through="RoleCapability", related_name="roles")

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name


class RoleCapability(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    capability = models.ForeignKey(Capability, on_delete=models.CASCADE)

    class Meta:
        constraints = [models.UniqueConstraint(fields=("role", "capability"), name="unique_role_capability")]


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        user = self.model(email=self.normalize_email(email).strip().lower(), **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if not extra_fields["is_staff"] or not extra_fields["is_superuser"]:
            raise ValueError("A superuser must have staff and superuser status.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True, max_length=254)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    roles = models.ManyToManyField(Role, blank=True, related_name="users")
    legacy_id = models.CharField(max_length=64, blank=True, null=True, unique=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ("last_name", "first_name", "email")
        indexes = [models.Index(fields=("is_active", "last_name"), name="user_active_last_name_idx")]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    @property
    def full_name(self):
        return self.get_full_name()

    @property
    def is_club_member(self):
        return self.roles.filter(code__in=(
            "member", "club_admin", "project_lead", "president", "event_manager", "pedagogical_supervisor", "communications_manager"
        )).exists()

    def has_role(self, *codes):
        if self.is_superuser:
            return True
        return self.roles.filter(code__in=codes).exists()

    def has_capability(self, code):
        if self.is_superuser:
            return True
        if not self.is_authenticated or not self.is_active:
            return False
        return self.roles.filter(capabilities__code=code).exists()


class MemberProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=32, blank=True)
    study_program = models.CharField(max_length=120, blank=True)
    study_year = models.CharField(max_length=40, blank=True)
    skills = models.JSONField(default=list, blank=True)
    joined_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.email}"


class MembershipRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        INFORMATION_REQUESTED = "information_requested", "Information requested"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="membership_requests")
    message = models.TextField(max_length=3000, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING, db_index=True)
    decision_note = models.TextField(max_length=2000, blank=True)
    decided_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="membership_decisions")
    decided_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.UniqueConstraint(fields=("user",), condition=Q(status="pending"), name="one_pending_membership_per_user")
        ]


class AuditLog(models.Model):
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_entries")
    action = models.CharField(max_length=80, db_index=True)
    target_type = models.CharField(max_length=80)
    target_id = models.CharField(max_length=64, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.action} {self.target_type}:{self.target_id}"
