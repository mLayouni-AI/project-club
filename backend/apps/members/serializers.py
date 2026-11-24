from django.contrib.auth import password_validation
from rest_framework import serializers

from .models import AuditLog, MemberProfile, MembershipRequest, Role, User


class MemberProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberProfile
        fields = ("phone", "study_program", "study_year", "skills", "joined_at")
        read_only_fields = ("joined_at",)


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SlugRelatedField(many=True, read_only=True, slug_field="code")
    capabilities = serializers.SerializerMethodField()
    profile = MemberProfileSerializer(read_only=False, required=False)
    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "full_name", "is_active", "is_superuser", "roles", "capabilities", "profile", "date_joined")
        read_only_fields = ("id", "email", "is_active", "is_superuser", "roles", "date_joined")

    def get_capabilities(self, user):
        return sorted({capability.code for role in user.roles.all() for capability in role.capabilities.all()})

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)
        if profile_data is not None:
            MemberProfile.objects.update_or_create(user=instance, defaults=profile_data)
        return instance


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "password", "confirm_password")

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Un compte utilise déjà cette adresse e-mail.")
        return email

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Les mots de passe ne correspondent pas."})
        candidate = User(email=attrs["email"], first_name=attrs["first_name"], last_name=attrs["last_name"])
        password_validation.validate_password(attrs["password"], user=candidate)
        return attrs

    def create(self, validated_data):
        raw_password = validated_data.pop("password")
        user = User.objects.create_user(password=raw_password, **validated_data)
        MemberProfile.objects.create(user=user)
        user.roles.add(Role.objects.get(code="visitor"))
        return user


class MembershipRequestSerializer(serializers.ModelSerializer):
    applicant = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    decided_by = serializers.CharField(source="decided_by.get_full_name", read_only=True)

    class Meta:
        model = MembershipRequest
        fields = ("id", "message", "status", "decision_note", "applicant", "email", "decided_by", "decided_at", "created_at")
        read_only_fields = fields


class MembershipRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipRequest
        fields = ("message",)

    def validate(self, attrs):
        user = self.context["request"].user
        if user.roles.filter(code="member").exists():
            raise serializers.ValidationError("Ce compte est déjà membre du club.")
        if user.membership_requests.filter(status=MembershipRequest.Status.PENDING).exists():
            raise serializers.ValidationError("Une demande est déjà en attente pour ce compte.")
        return attrs


class MembershipReviewSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=(
        MembershipRequest.Status.APPROVED,
        MembershipRequest.Status.REJECTED,
        MembershipRequest.Status.INFORMATION_REQUESTED,
    ))
    decision_note = serializers.CharField(max_length=2000, required=False, allow_blank=True)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, trim_whitespace=False)
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value):
        password_validation.validate_password(value, user=self.context["request"].user)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_new_password(self, value):
        password_validation.validate_password(value)
        return value


class RoleAssignmentSerializer(serializers.Serializer):
    roles = serializers.SlugRelatedField(many=True, slug_field="code", queryset=Role.objects.all())

    def validate_roles(self, roles):
        if any(role.code == "super_admin" for role in roles):
            raise serializers.ValidationError("Le rôle système superutilisateur ne peut pas être attribué ici.")
        return roles


class AuditLogSerializer(serializers.ModelSerializer):
    actor_email = serializers.EmailField(source="actor.email", read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = ("id", "actor_email", "action", "target_type", "target_id", "metadata", "created_at")
        read_only_fields = fields
