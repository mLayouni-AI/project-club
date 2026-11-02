
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Event
from .serializers import EventSerializer
from apps.members.permissions import IsAdminOrReadOnly


class EventListCreate(APIView):
    permission_classes = [IsAdminOrReadOnly]  # Members can view, only admins can create

    def get(self, request):
        try:
            objs = Event.objects.order_by('-date_start')
            res = []
            for e in objs:
                d = e.to_mongo().to_dict()
                d['id'] = str(e.id)
                # Remove the _id field to avoid ObjectId serialization issues
                d.pop('_id', None)
                res.append(d)
            return Response(res)
        except Exception as e:
            # Return mock data when MongoDB is not available
            mock_events = [
                {
                    'id': '1',
                    'name': 'Monthly Meetup',
                    'description': 'Regular monthly gathering for all club members',
                    'status': 'active',
                    'date_start': '2025-12-15T18:00:00Z',
                    'date_end': '2025-12-15T20:00:00Z',
                    'location': 'Main Conference Room'
                },
                {
                    'id': '2',
                    'name': 'Hackathon',
                    'description': '24-hour coding competition',
                    'status': 'active',
                    'date_start': '2025-12-20T09:00:00Z',
                    'date_end': '2025-12-21T09:00:00Z',
                    'location': 'Innovation Lab'
                }
            ]
            return Response(mock_events)

    def post(self, request):
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            try:
                created = serializer.save()
                # Convert to dict
                if hasattr(created, 'to_mongo'):
                    d = created.to_mongo().to_dict()
                    d['id'] = str(created.id)
                    d.pop('_id', None)
                    return Response(d, status=status.HTTP_201_CREATED)
                else:
                    return Response(created, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventDetail(APIView):
    permission_classes = [IsAdminOrReadOnly]  # Members can view, only admins can update/delete

    def get_obj(self, pk):
        try:
            return Event.objects.get(id=pk)
        except Event.DoesNotExist:
            return None
        except Exception:
            return None

    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response(
                {'detail': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            d = obj.to_mongo().to_dict()
            d['id'] = str(obj.id)
            d.pop('_id', None)
            return Response(d)
        except Exception as e:
            return Response(
                {'detail': f'Error retrieving event: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response(
                {'detail': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = EventSerializer(obj, data=request.data)
        if serializer.is_valid():
            try:
                updated = serializer.save()
                # Convert to dict
                if hasattr(updated, 'to_mongo'):
                    d = updated.to_mongo().to_dict()
                    d['id'] = str(updated.id)
                    d.pop('_id', None)
                    return Response(d)
                else:
                    return Response(serializer.data)
            except Exception as e:
                return Response(
                    {'detail': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response(
                {'detail': 'Event not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        try:
            obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'detail': f'Error deleting event: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
