
from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(allow_blank=True, required=False, max_length=1000)
    status = serializers.ChoiceField(choices=['on hold', 'in progress', 'completed'], required=False)
    team_members = serializers.ListField(child=serializers.CharField(), required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        project = Project(**validated_data)
        project.save()
        return project

    def update(self, instance, validated_data):
        for k, v in validated_data.items():
            setattr(instance, k, v)
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
            return data
        return instance
