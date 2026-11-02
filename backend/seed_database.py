"""
Database seeding script to create initial admin users and test members
"""
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clubsite.settings')
django.setup()

from apps.members.models import Member

def seed_database():
    """Create initial admin and member users"""
    
    print("🌱 Starting database seeding...")
    
    # Create Admin Users
    admins = [
        {
            'first_name': 'President',
            'last_name': 'SuperAdmin',
            'email': 'president@alienscoder.com',
            'password': 'president123',
            'role': 'super_admin'
        },
        {
            'first_name': 'Admin',
            'last_name': 'User',
            'email': 'admin@alienscoder.com',
            'password': 'admin123',
            'role': 'admin'
        },
        {
            'first_name': 'Sarah',
            'last_name': 'Admin',
            'email': 'sarah.admin@alienscoder.com',
            'password': 'admin123',
            'role': 'admin'
        },
        {
            'first_name': 'Mohammed',
            'last_name': 'Admin',
            'email': 'mohammed.admin@alienscoder.com',
            'password': 'admin123',
            'role': 'admin'
        },
        {
            'first_name': 'Fatima',
            'last_name': 'Admin',
            'email': 'fatima.admin@alienscoder.com',
            'password': 'admin123',
            'role': 'admin'
        },
        {
            'first_name': 'Hassan',
            'last_name': 'Admin',
            'email': 'hassan.admin@alienscoder.com',
            'password': 'admin123',
            'role': 'admin'
        }
    ]
    
    # Create Sample Members
    members = [
        {
            'first_name': 'Ayoub',
            'last_name': 'Developer',
            'email': 'ayoub@alienscoder.com',
            'password': 'member123',
            'role': 'member'
        },
        {
            'first_name': 'Salma',
            'last_name': 'Designer',
            'email': 'salma@alienscoder.com',
            'password': 'member123',
            'role': 'member'
        },
        {
            'first_name': 'Rachid',
            'last_name': 'Fullstack',
            'email': 'rachid@alienscoder.com',
            'password': 'member123',
            'role': 'member'
        },
        {
            'first_name': 'Amina',
            'last_name': 'Frontend',
            'email': 'amina@alienscoder.com',
            'password': 'member123',
            'role': 'member'
        },
        {
            'first_name': 'Youssef',
            'last_name': 'Backend',
            'email': 'youssef@alienscoder.com',
            'password': 'member123',
            'role': 'member'
        }
    ]
    
    # Create admins
    print("\n👨‍💼 Creating admin users...")
    for admin_data in admins:
        try:
            # Check if user already exists
            existing = Member.objects(email=admin_data['email']).first()
            if existing:
                print(f"   ⚠️  Admin {admin_data['email']} already exists, skipping...")
                continue
            
            # Create new admin
            admin = Member(
                first_name=admin_data['first_name'],
                last_name=admin_data['last_name'],
                email=admin_data['email'],
                role=admin_data['role']
            )
            admin.set_password(admin_data['password'])
            admin.save()
            print(f"   ✅ Created admin: {admin.email}")
        except Exception as e:
            print(f"   ❌ Error creating admin {admin_data['email']}: {str(e)}")
    
    # Create members
    print("\n👥 Creating member users...")
    for member_data in members:
        try:
            # Check if user already exists
            existing = Member.objects(email=member_data['email']).first()
            if existing:
                print(f"   ⚠️  Member {member_data['email']} already exists, skipping...")
                continue
            
            # Create new member
            member = Member(
                first_name=member_data['first_name'],
                last_name=member_data['last_name'],
                email=member_data['email'],
                role=member_data['role']
            )
            member.set_password(member_data['password'])
            member.save()
            print(f"   ✅ Created member: {member.email}")
        except Exception as e:
            print(f"   ❌ Error creating member {member_data['email']}: {str(e)}")
    
    print("\n✨ Database seeding completed!")
    print("\n📋 Test Credentials:")
    print("   Admin: admin@alienscoder.com / admin123")
    print("   Member: ayoub@alienscoder.com / member123")

if __name__ == '__main__':
    try:
        seed_database()
    except Exception as e:
        print(f"\n❌ Seeding failed: {str(e)}")
        import traceback
        traceback.print_exc()
