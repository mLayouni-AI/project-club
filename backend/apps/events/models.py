
from mongoengine import Document, StringField, DateTimeField, ListField
import datetime

class Event(Document):
    name = StringField(required=True, unique=True, max_length=200)
    description = StringField(max_length=1000)
    status = StringField(choices=('active', 'cancelled', 'completed'), default='active')
    date_start = DateTimeField()
    date_end = DateTimeField()
    participants = ListField(StringField())  # store participant member ids as strings
    location = StringField(max_length=200)
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {'collection': 'events'}
    
    def clean(self):
        # Clean up fields
        if self.name:
            self.name = self.name.strip().title()
        if self.description:
            self.description = self.description.strip()
        if self.location:
            self.location = self.location.strip()
    
    def save(self, *args, **kwargs):
        self.clean()
        # Update the updated_at timestamp
        self.updated_at = datetime.datetime.utcnow()
        super().save(*args, **kwargs)
