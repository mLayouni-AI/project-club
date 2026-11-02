
from mongoengine import Document, StringField, ListField, DateTimeField
import datetime

class Project(Document):
    name = StringField(required=True, unique=True, max_length=200)
    description = StringField(max_length=1000)
    status = StringField(choices=('on hold', 'in progress', 'completed'), default='on hold')
    team_members = ListField(StringField())  # store member ids as strings
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    updated_at = DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {'collection': 'projects'}
    
    def clean(self):
        # Clean up fields
        if self.name:
            self.name = self.name.strip().title()
        if self.description:
            self.description = self.description.strip()
    
    def save(self, *args, **kwargs):
        self.clean()
        # Update the updated_at timestamp
        self.updated_at = datetime.datetime.utcnow()
        super().save(*args, **kwargs)
