from rest_framework.permissions import BasePermission


class HasCapability(BasePermission):
    capability = None

    def has_permission(self, request, view):
        capability = getattr(view, "required_capability", self.capability)
        return bool(request.user and request.user.is_authenticated and capability and request.user.has_capability(capability))


class IsClubAdministrator(HasCapability):
    capability = "members.manage_members"
