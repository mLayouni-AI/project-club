
from mongoengine import Document, StringField, DateTimeField, EmailField
from django.contrib.auth.hashers import make_password, check_password
import datetime

class Member(Document):
    first_name = StringField(required=True, max_length=100)
    last_name = StringField(required=True, max_length=100)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True)  # Hashed password
    role = StringField(choices=['super_admin', 'admin', 'member'], default='member')
    date_of_joining = DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {'collection': 'members'}
    
    def clean(self):
        # Clean up fields
        if self.first_name is not None:
            self.first_name = self.first_name.strip().title()
        if self.last_name is not None:
            self.last_name = self.last_name.strip().title()
        if self.email is not None:
            self.email = self.email.strip().lower()
    
    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash"""
        return check_password(raw_password, self.password)
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
