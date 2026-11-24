from rest_framework import serializers

from .models import Attendance, Event, EventRegistration


class EventSerializer(serializers.ModelSerializer):
    capacity_remaining = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    registration_count = serializers.SerializerMethodField()
    responsible_name = serializers.CharField(source="responsible.get_full_name", read_only=True, allow_null=True)

    class Meta:
        model = Event
        fields = (
            "id", "name", "description", "event_type", "starts_at", "ends_at", "location", "capacity",
            "responsible", "responsible_name", "status", "audience", "details", "registration_count",
            "capacity_remaining", "is_registered", "created_at", "updated_at",
        )
        read_only_fields = ("id", "responsible_name", "registration_count", "capacity_remaining", "is_registered", "created_at", "updated_at")

    def validate_capacity(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("La capacité doit être supérieure à zéro.")
        return value

    def validate(self, attrs):
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts_at and ends_at and ends_at < starts_at:
            raise serializers.ValidationError({"ends_at": "La fin doit être postérieure au début."})
        responsible = attrs.get("responsible", getattr(self.instance, "responsible", None))
        if responsible and not responsible.has_capability("events.manage_events"):
            raise serializers.ValidationError({"responsible": "Le responsable doit avoir la capacité de gérer les événements."})
        return attrs

    def get_registration_count(self, event):
        if hasattr(event, "_registration_count"):
            return event._registration_count
        return event.registrations.filter(status=EventRegistration.Status.REGISTERED).count()

    def get_capacity_remaining(self, event):
        if event.capacity is None:
            return None
        return max(event.capacity - self.get_registration_count(event), 0)

    def get_is_registered(self, event):
        if hasattr(event, "_is_registered"):
            return event._is_registered
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and event.registrations.filter(user=request.user, status=EventRegistration.Status.REGISTERED).exists())


class EventRegistrationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = EventRegistration
        fields = ("id", "event", "user", "user_name", "email", "status", "registered_at", "cancelled_at")
        read_only_fields = fields


class AttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    recorded_by_name = serializers.CharField(source="recorded_by.get_full_name", read_only=True, allow_null=True)

    class Meta:
        model = Attendance
        fields = ("id", "event", "user", "user_name", "email", "status", "recorded_by", "recorded_by_name", "recorded_at")
        read_only_fields = ("id", "event", "recorded_by", "recorded_by_name", "recorded_at")


class AttendanceMarkSerializer(serializers.Serializer):
    user = serializers.IntegerField()
    status = serializers.ChoiceField(choices=Attendance.Status.choices)
