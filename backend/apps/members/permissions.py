"""
Custom permissions for role-based access control
"""
from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Permission class that allows only Super Admins to perform operations.
    """
    
    def has_permission(self, request, view):
        # Require authentication
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is Super Admin
        if hasattr(request, 'auth') and request.auth:
            user_role = request.auth.get('role', None)
            return user_role in ['super_admin']
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Check if user is Super Admin
        if hasattr(request, 'auth') and request.auth:
            user_role = request.auth.get('role', None)
            return user_role in ['super_admin']
        
        return False

class IsAdminOrSuperAdmin(permissions.BasePermission):
    """
    Permission class that allows Admins and Super Admins to perform operations.
    """
    
    def has_permission(self, request, view):
        # Require authentication
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user is Admin or Super Admin
        if hasattr(request, 'auth') and request.auth:
            user_role = request.auth.get('role', None)
            return user_role in ['admin', 'super_admin']
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Check if user is Admin or Super Admin
        if hasattr(request, 'auth') and request.auth:
            user_role = request.auth.get('role', None)
            return user_role in ['admin', 'super_admin']
        
        return False

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission class that allows:
    - Authenticated users: Read-only access
    - Admins: Full CRUD access
    """
    
    def has_permission(self, request, view):
        # Require authentication
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Allow read-only access for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # For write operations, check admin role from JWT token
        if hasattr(request, 'auth') and request.auth:
            user_role = request.auth.get('role', None)
            return user_role in ['admin', 'super_admin']
        
        return False
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for admins
        if hasattr(request, 'auth') and request.auth:
            user_role = request.auth.get('role', None)
            return user_role in ['admin', 'super_admin']
        
        return False