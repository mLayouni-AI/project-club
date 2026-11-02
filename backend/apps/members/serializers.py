
import secrets
import string
from rest_framework import serializers
from .models import Member

class MemberSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False)
    role = serializers.ChoiceField(choices=['super_admin', 'admin', 'member'], default='member')
    date_of_joining = serializers.DateTimeField(read_only=True)
    
    def validate_email(self, value):
        # Normalize email to lowercase
        email = value.lower().strip()
        # Check if email already exists
        try:
            if Member.objects(email=email).first():
                raise serializers.ValidationError('A user with this email already exists.')
        except:
            # If database is not available, skip the check
            pass
        return email

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        member = Member(**validated_data)
        if password:
            member.set_password(password)
        else:
            # Generate a random temporary password
            temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits + string.punctuation) for _ in range(12))
            member.set_password(temp_password)
        # Save the member and handle any potential errors
        try:
            member.save()
        except Exception as e:
            # This will help identify the specific error
            print(f"Error saving member: {str(e)}")
            raise e
        return member

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        # instance here is a mongoengine Document
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
    
    def save(self):
        """Save method that works with both create and update"""
        if self.instance is None:
            # Create new instance
            return self.create(self.validated_data)
        else:
            # Update existing instance
            return self.update(self.instance, self.validated_data)

    def to_representation(self, instance):
        """Convert mongoengine document to dict representation"""
        if hasattr(instance, 'to_mongo'):
            data = instance.to_mongo().to_dict()
            data['id'] = str(instance.id)
            # Remove the _id field to avoid ObjectId serialization issues
            data.pop('_id', None)
            # Remove password from response
            data.pop('password', None)
            return data
        return instance


class SignupSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=4)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    def validate_email(self, value):
        """Check if email already exists"""
        if Member.objects(email=value.lower()).first():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()
    
    def validate(self, data):
        """Validate that passwords match"""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        member = Member(
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            email=validated_data['email'],
            role='member'  # Always create as member, admins are manually set
        )
        member.set_password(password)
        member.save()
        return member


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
