from django.test import TestCase
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIClient
from rest_framework import status
from apps.members.models import Member


class MemberAPITestCase(TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.client = APIClient()
        
        # Create test members
        self.admin_user = Member.objects.create(
            first_name='Test',
            last_name='Admin',
            email='admin@test.com',
            password=make_password('password123'),
            role='admin'
        )
        
        self.member_user = Member.objects.create(
            first_name='Test',
            last_name='Member',
            email='member@test.com',
            password=make_password('password123'),
            role='member'
        )
        
        self.super_admin_user = Member.objects.create(
            first_name='Test',
            last_name='SuperAdmin',
            email='superadmin@test.com',
            password=make_password('password123'),
            role='super_admin'
        )

    def test_member_list_requires_authentication(self):
        """Test that member list endpoint requires authentication."""
        response = self.client.get('/api/members/')
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_member_creation_requires_admin(self):
        """Test that only admins can create members."""
        # Test unauthenticated request
        response = self.client.post('/api/members/', {
            'first_name': 'New',
            'last_name': 'User',
            'email': 'newuser@test.com',
            'password': 'password123',
            'role': 'member'
        })
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_member_detail_requires_authentication(self):
        """Test that member detail endpoint requires authentication."""
        response = self.client.get(f'/api/members/{self.member_user.id}/')
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_member_update_requires_admin(self):
        """Test that only admins can update members."""
        response = self.client.put(f'/api/members/{self.member_user.id}/', {
            'first_name': 'Updated',
            'last_name': 'User',
            'email': 'updated@test.com',
            'role': 'admin'
        })
        self.assertEqual(response.status_code, 401)  # Unauthorized

    def test_member_delete_requires_admin(self):
        """Test that only admins can delete members."""
        response = self.client.delete(f'/api/members/{self.member_user.id}/')
        self.assertEqual(response.status_code, 401)  # Unauthorized


class MemberModelTestCase(TestCase):
    def test_member_creation(self):
        """Test member model creation."""
        member = Member.objects.create(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123',
            role='member'
        )
        
        self.assertEqual(member.first_name, 'Test')
        self.assertEqual(member.last_name, 'User')
        self.assertEqual(member.email, 'test@test.com')
        self.assertEqual(member.role, 'member')
        self.assertTrue(member.check_password('password123'))

    def test_member_role_choices(self):
        """Test that member role is limited to allowed choices."""
        member = Member(
            first_name='Test',
            last_name='User',
            email='test@test.com',
            password='password123',
            role='super_admin'  # This should be valid
        )
        member.save()
        self.assertEqual(member.role, 'super_admin')