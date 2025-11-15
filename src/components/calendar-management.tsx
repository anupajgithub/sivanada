import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar, Edit, Plus, Trash2, Clock, MapPin, Users, Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { calendarService } from '../services';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  attendees?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  category: 'meeting' | 'event' | 'deadline' | 'reminder';
}

export function CalendarManagement() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events from Firebase
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const result = await calendarService.getEvents();
        if (result.success && result.data) {
          setEvents(result.data);
        } else {
          console.error('Failed to load events:', result.error);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    location: '',
    attendees: 0,
    status: 'scheduled',
    priority: 'medium',
    category: 'meeting'
  });

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || event.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await calendarService.createEvent({
        title: newEvent.title!,
        description: newEvent.description!,
        date: newEvent.date!,
        time: newEvent.time!,
        location: newEvent.location,
        attendees: newEvent.attendees,
        status: newEvent.status as CalendarEvent['status'],
        priority: newEvent.priority as CalendarEvent['priority'],
        category: newEvent.category as CalendarEvent['category']
      });

      if (result.success && result.data) {
        setEvents([...events, result.data]);
        setNewEvent({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          time: '09:00',
          location: '',
          attendees: 0,
          status: 'scheduled',
          priority: 'medium',
          category: 'meeting'
        });
        setIsDialogOpen(false);
        toast.success('Event created successfully!');
      } else {
        toast.error('Failed to create event: ' + result.error);
      }
    } catch (error) {
      toast.error('Error creating event: ' + (error as Error).message);
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent || !editingEvent.title || !editingEvent.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await calendarService.updateEvent(editingEvent.id, editingEvent as any);
      if (res.success && res.data) {
        setEvents(events.map(event => event.id === editingEvent.id ? res.data! : event));
        toast.success('Event updated successfully!');
      } else {
        toast.error(res.error || 'Failed to update event');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update event');
    }
    setEditingEvent(null);
    setIsDialogOpen(false);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await calendarService.deleteEvent(id);
      if (res.success) {
        setEvents(events.filter(event => event.id !== id));
        toast.success('Event deleted successfully!');
      } else {
        toast.error(res.error || 'Failed to delete event');
      }
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete event');
    }
  };

  const getStatusColor = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
        <p className="text-orange-600 mt-2">Manage events, meetings, and important dates</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        {/* Search and Filters */}
        <div className="flex flex-1 gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-orange-200 focus:border-orange-500"
            />
          </div>
          {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white border-orange-200">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 bg-white border-orange-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="reminder">Reminder</SelectItem>
            </SelectContent>
          </Select> */}
        </div>

        {/* Add Event Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
              <DialogDescription>
                {editingEvent ? 'Update event details' : 'Add a new event to the calendar'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={editingEvent ? editingEvent.title : newEvent.title}
                  onChange={(e) => {
                    if (editingEvent) {
                      setEditingEvent({ ...editingEvent, title: e.target.value });
                    } else {
                      setNewEvent({ ...newEvent, title: e.target.value });
                    }
                  }}
                  placeholder="Enter event title"
                  className="bg-white border-orange-200"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={editingEvent ? editingEvent.description : newEvent.description}
                  onChange={(e) => {
                    if (editingEvent) {
                      setEditingEvent({ ...editingEvent, description: e.target.value });
                    } else {
                      setNewEvent({ ...newEvent, description: e.target.value });
                    }
                  }}
                  placeholder="Enter event description"
                  className="bg-white border-orange-200 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editingEvent ? editingEvent.date : newEvent.date}
                    onChange={(e) => {
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, date: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, date: e.target.value });
                      }
                    }}
                    className="bg-white border-orange-200"
                  />
                </div>
                {/* <div>
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={editingEvent ? editingEvent.time : newEvent.time}
                    onChange={(e) => {
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, time: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, time: e.target.value });
                      }
                    }}
                    className="bg-white border-orange-200"
                  />
                </div> */}
              </div>

              {/* <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editingEvent ? editingEvent.location || '' : newEvent.location || ''}
                  onChange={(e) => {
                    if (editingEvent) {
                      setEditingEvent({ ...editingEvent, location: e.target.value });
                    } else {
                      setNewEvent({ ...newEvent, location: e.target.value });
                    }
                  }}
                  placeholder="Enter location (optional)"
                  className="bg-white border-orange-200"
                />
              </div> */}

              {/* <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingEvent ? editingEvent.category : newEvent.category}
                    onValueChange={(value) => {
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, category: value as CalendarEvent['category'] });
                      } else {
                        setNewEvent({ ...newEvent, category: value as CalendarEvent['category'] });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={editingEvent ? editingEvent.priority : newEvent.priority}
                    onValueChange={(value) => {
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, priority: value as CalendarEvent['priority'] });
                      } else {
                        setNewEvent({ ...newEvent, priority: value as CalendarEvent['priority'] });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editingEvent ? editingEvent.status : newEvent.status}
                    onValueChange={(value) => {
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, status: value as CalendarEvent['status'] });
                      } else {
                        setNewEvent({ ...newEvent, status: value as CalendarEvent['status'] });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-orange-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div> */}
{/* 
              <div>
                <Label htmlFor="attendees">Expected Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  min="0"
                  value={editingEvent ? editingEvent.attendees || 0 : newEvent.attendees || 0}
                  onChange={(e) => {
                    if (editingEvent) {
                      setEditingEvent({ ...editingEvent, attendees: parseInt(e.target.value) || 0 });
                    } else {
                      setNewEvent({ ...newEvent, attendees: parseInt(e.target.value) || 0 });
                    }
                  }}
                  placeholder="0"
                  className="bg-white border-orange-200"
                />
              </div> */}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingEvent(null);
                  setNewEvent({
                    title: '',
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                    time: '09:00',
                    location: '',
                    attendees: 0,
                    status: 'scheduled',
                    priority: 'medium',
                    category: 'meeting'
                  });
                }}
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                Cancel
              </Button>
              <Button
                onClick={editingEvent ? handleEditEvent : handleCreateEvent}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
              >
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-all duration-200 border-orange-200/40 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-900 line-clamp-1">{event.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {/* <Badge className={`text-xs ${getStatusColor(event.status)}`}>
                      {event.status}
                    </Badge>
                    <Badge className={`text-xs ${getPriorityColor(event.priority)}`}>
                      {event.priority}
                    </Badge> */}
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingEvent(event);
                      setIsDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteEvent(event.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                  {/* <Clock className="h-4 w-4 text-orange-500 ml-2" /> */}
                  {/* <span>{event.time}</span> */}
                </div>
                
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
                
                {/* {event.attendees && event.attendees > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span>{event.attendees} expected attendees</span>
                  </div>
                )} */}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-orange-100">
                {/* <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  {event.category}
                </Badge> */}
                <span className="text-xs text-gray-500">
                  ID: {event.id}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first event to get started'}
          </p>
        </div>
      )}
    </div>
  );
}