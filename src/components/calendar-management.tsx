import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar, Edit, Plus, Trash2, Search, Download } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner@2.0.3';
import { calendarService } from '../services';
import { CalendarEvent } from '../types';
import { seedCalendarEvents, formatDateForStorage } from '../services/calendarSeedData';

const MONTHS = [
  { value: 'JAN', label: 'January' },
  { value: 'FEB', label: 'February' },
  { value: 'MAR', label: 'March' },
  { value: 'APR', label: 'April' },
  { value: 'MAY', label: 'May' },
  { value: 'JUN', label: 'June' },
  { value: 'JUL', label: 'July' },
  { value: 'AUG', label: 'August' },
  { value: 'SEP', label: 'September' },
  { value: 'OCT', label: 'October' },
  { value: 'NOV', label: 'November' },
  { value: 'DEC', label: 'December' },
];

const COMMON_EVENT_TYPES = [
  'Fast',
  'Festival',
  'Anniversary',
  'Ceremony',
  'Puja',
  'Aradhana',
  'Jayanti',
  'Utsav',
  'Mahotsav',
  'Reminder',
  'Meeting',
];

export function CalendarManagement() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: '',
    date: '',
    month: 'JAN',
    year: new Date().getFullYear(),
    type: 'Festival',
    description: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Load events from Firebase
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const result = await calendarService.getEvents({ limit: 1000 });
        if (result.success && result.data) {
          // Sort events by year, month, and date
          const sortedEvents = result.data.sort((a, b) => {
            if (!a.year || !a.month || !a.date) return 1;
            if (!b.year || !b.month || !b.date) return -1;
            
            if (a.year !== b.year) return a.year - b.year;
            
            const monthOrder: { [key: string]: number } = {
              'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
              'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
            };
            
            const aMonth = monthOrder[a.month] || 0;
            const bMonth = monthOrder[b.month] || 0;
            if (aMonth !== bMonth) return aMonth - bMonth;
            
            return parseInt(a.date) - parseInt(b.date);
          });
          
          setEvents(sortedEvents);
        }
      } catch (error) {
        console.error('Error loading events:', error);
        toast.error('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Get unique event types from all events for filter dropdown
  const availableTypes = React.useMemo(() => {
    const types = new Set<string>();
    events.forEach(event => {
      if (event.type) {
        types.add(event.type);
      }
    });
    return Array.from(types).sort();
  }, [events]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || 
                       (event.type && event.type.toLowerCase() === typeFilter.toLowerCase());
    
    return matchesSearch && matchesType;
  });

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date || !newEvent.month || !newEvent.year || !newEvent.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await calendarService.createEvent({
        title: newEvent.title!,
        description: newEvent.description || newEvent.title!,
        date: newEvent.date!,
        month: newEvent.month!,
        year: newEvent.year!,
        type: newEvent.type!
      });

      if (result.success && result.data) {
        setEvents([...events, result.data].sort((a, b) => {
          if (!a.year || !a.month || !a.date) return 1;
          if (!b.year || !b.month || !b.date) return -1;
          if (a.year !== b.year) return a.year - b.year;
          const monthOrder: { [key: string]: number } = {
            'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
            'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
          };
          const aMonth = monthOrder[a.month] || 0;
          const bMonth = monthOrder[b.month] || 0;
          if (aMonth !== bMonth) return aMonth - bMonth;
          return parseInt(a.date) - parseInt(b.date);
        }));
        setNewEvent({
          title: '',
          date: '',
          month: 'JAN',
          year: new Date().getFullYear(),
          type: 'Festival',
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
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
    if (!editingEvent || !editingEvent.title || !editingEvent.date || !editingEvent.month || !editingEvent.year || !editingEvent.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await calendarService.updateEvent(editingEvent.id, {
        ...editingEvent,
        updatedAt: new Date().toISOString()
      } as any);
      
      if (res.success && res.data) {
        setEvents(events.map(event => event.id === editingEvent.id ? res.data! : event).sort((a, b) => {
          if (!a.year || !a.month || !a.date) return 1;
          if (!b.year || !b.month || !b.date) return -1;
          if (a.year !== b.year) return a.year - b.year;
          const monthOrder: { [key: string]: number } = {
            'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
            'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
          };
          const aMonth = monthOrder[a.month] || 0;
          const bMonth = monthOrder[b.month] || 0;
          if (aMonth !== bMonth) return aMonth - bMonth;
          return parseInt(a.date) - parseInt(b.date);
        }));
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
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

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

  const handleSeedEvents = async () => {
    if (!confirm('This will add initial calendar events. Continue?')) {
      return;
    }

    setSeeding(true);
    try {
      const result = await seedCalendarEvents();
      if (result.success) {
        toast.success(result.message);
        // Reload events
        const loadResult = await calendarService.getEvents({ limit: 1000 });
        if (loadResult.success && loadResult.data) {
          const sortedEvents = loadResult.data.sort((a, b) => {
            if (!a.year || !a.month || !a.date) return 1;
            if (!b.year || !b.month || !b.date) return -1;
            if (a.year !== b.year) return a.year - b.year;
            const monthOrder: { [key: string]: number } = {
              'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MAY': 5, 'JUN': 6,
              'JUL': 7, 'AUG': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DEC': 12
            };
            const aMonth = monthOrder[a.month] || 0;
            const bMonth = monthOrder[b.month] || 0;
            if (aMonth !== bMonth) return aMonth - bMonth;
            return parseInt(a.date) - parseInt(b.date);
          });
          setEvents(sortedEvents);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error('Error seeding events: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  const getTypeColor = (type?: string) => {
    if (!type) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const typeLower = type.toLowerCase();
    switch (typeLower) {
      case 'fast': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'festival': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'anniversary': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'ceremony': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'puja': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aradhana': return 'bg-red-100 text-red-800 border-red-200';
      case 'jayanti': return 'bg-green-100 text-green-800 border-green-200';
      case 'utsav': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'mahotsav': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'reminder': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'meeting': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatEventDate = (event: CalendarEvent) => {
    if (event.date && event.month && event.year) {
      return `${event.date} ${event.month} ${event.year}`;
    }
    return 'Date not set';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
        <p className="text-orange-600 mt-2">Manage festivals and important dates</p>
      </div>

      {/* Show banner if no events */}
      {!loading && events.length === 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-orange-50 border-2 border-green-200 shadow-lg">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Quick Start: Load Initial Events</h3>
                </div>
                <p className="text-sm text-gray-600">Click the button to automatically add all 31 pre-configured calendar events (Dec 2025 - Mar 2026) including festivals and fasting days.</p>
              </div>
              <Button 
                onClick={handleSeedEvents}
                disabled={seeding}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg px-6 py-6 text-base font-semibold whitespace-nowrap"
              >
                {seeding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading Events...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Load Initial Events (31 Events)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48 bg-white border-orange-200">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {availableTypes.length > 0 && (
                <>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </>
              )}
              {availableTypes.length === 0 && (
                <>
                  <SelectItem value="Fast">Fast</SelectItem>
                  <SelectItem value="Festival">Festival</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {/* <Button 
            onClick={handleSeedEvents}
            disabled={seeding || loading}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700 font-medium"
            title="Load 31 pre-configured calendar events"
          >
            {seeding ? (
              <>
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Load Initial Events
              </>
            )}
          </Button> */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
                  {(editingEvent ? editingEvent.type : newEvent.type) && (
                    <Badge className={getTypeColor(editingEvent ? editingEvent.type : newEvent.type)}>
                      {editingEvent ? editingEvent.type : newEvent.type}
                    </Badge>
                  )}
                </div>
                <DialogDescription>
                  {editingEvent ? 'Update event details' : 'Add a new event to the calendar'}
                  {((editingEvent ? editingEvent.date && editingEvent.month && editingEvent.year : newEvent.date && newEvent.month && newEvent.year)) && (
                    <span className="block mt-1 text-orange-600 font-medium">
                      Date: {formatEventDate({
                        date: editingEvent ? editingEvent.date : newEvent.date || '',
                        month: editingEvent ? editingEvent.month : newEvent.month || '',
                        year: editingEvent ? editingEvent.year : newEvent.year || 0
                      } as CalendarEvent)}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Date Selection Section */}
                <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-200">
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">Event Date *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="date" className="text-xs text-gray-600">Day</Label>
                      <Input
                        id="date"
                        type="number"
                        min="1"
                        max="31"
                        value={editingEvent ? editingEvent.date : newEvent.date || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (editingEvent) {
                            setEditingEvent({ ...editingEvent, date: value });
                          } else {
                            setNewEvent({ ...newEvent, date: value });
                          }
                        }}
                        placeholder="15"
                        className="bg-white border-orange-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="month" className="text-xs text-gray-600">Month</Label>
                      <Select
                        value={editingEvent ? editingEvent.month : newEvent.month || 'JAN'}
                        onValueChange={(value) => {
                          if (editingEvent) {
                            setEditingEvent({ ...editingEvent, month: value });
                          } else {
                            setNewEvent({ ...newEvent, month: value });
                          }
                        }}
                      >
                        <SelectTrigger className="bg-white border-orange-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(month => (
                            <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="year" className="text-xs text-gray-600">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        min="2020"
                        max="2100"
                        value={editingEvent ? editingEvent.year : newEvent.year || new Date().getFullYear()}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (editingEvent) {
                            setEditingEvent({ ...editingEvent, year: value });
                          } else {
                            setNewEvent({ ...newEvent, year: value });
                          }
                        }}
                        placeholder="2025"
                        className="bg-white border-orange-200"
                      />
                    </div>
                  </div>
                  {/* Date Preview */}
                  {((editingEvent ? editingEvent.date : newEvent.date) && 
                    (editingEvent ? editingEvent.month : newEvent.month) && 
                    (editingEvent ? editingEvent.year : newEvent.year)) && (
                    <div className="mt-3 pt-3 border-t border-orange-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          Selected Date: {formatEventDate({
                            date: editingEvent ? editingEvent.date : newEvent.date || '',
                            month: editingEvent ? editingEvent.month : newEvent.month || '',
                            year: editingEvent ? editingEvent.year : newEvent.year || 0
                          } as CalendarEvent)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Type Section */}
                <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-200">
                  <Label htmlFor="type" className="text-sm font-semibold text-gray-700 mb-3 block">Event Type *</Label>
                  <Input
                    id="type"
                    value={editingEvent ? (editingEvent.type || '') : (newEvent.type || '')}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, type: value });
                      } else {
                        setNewEvent({ ...newEvent, type: value });
                      }
                    }}
                    placeholder="Enter event type (e.g., Fast, Festival, Anniversary, Puja)"
                    className="bg-white border-purple-200 mb-3"
                  />
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-gray-600 mr-2 self-center">Quick select:</span>
                    {COMMON_EVENT_TYPES.map((type) => {
                      const currentType = editingEvent ? editingEvent.type : newEvent.type || '';
                      const isSelected = currentType.toLowerCase() === type.toLowerCase();
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (editingEvent) {
                              setEditingEvent({ ...editingEvent, type: type });
                            } else {
                              setNewEvent({ ...newEvent, type: type });
                            }
                          }}
                          className={
                            isSelected
                              ? `${getTypeColor(type)} border-0 text-xs h-7`
                              : "text-xs h-7 border-purple-300 text-purple-700 hover:bg-purple-100"
                          }
                        >
                          {type}
                        </Button>
                      );
                    })}
                  </div>
                  {((editingEvent ? editingEvent.type : newEvent.type) && 
                    !COMMON_EVENT_TYPES.some(t => t.toLowerCase() === ((editingEvent ? editingEvent.type : newEvent.type) || '').toLowerCase())) && (
                    <div className="mt-2 text-xs text-purple-600">
                      ✓ Using custom type: <span className="font-semibold">{editingEvent ? editingEvent.type : newEvent.type}</span>
                    </div>
                  )}
                </div>

                {/* Title Section */}
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={editingEvent ? editingEvent.title : newEvent.title || ''}
                    onChange={(e) => {
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, title: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, title: e.target.value });
                      }
                    }}
                    placeholder="Enter event title (e.g., Ekadashi, Purnima, Holi)"
                    className="bg-white border-orange-200"
                  />
                </div>

                {/* Description Section */}
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={editingEvent ? (editingEvent.description || '') : (newEvent.description || '')}
                    onChange={(e) => {
                      if (editingEvent) {
                        setEditingEvent({ ...editingEvent, description: e.target.value });
                      } else {
                        setNewEvent({ ...newEvent, description: e.target.value });
                      }
                    }}
                    placeholder="Enter event description"
                    className="bg-white border-orange-200"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingEvent(null);
                    setNewEvent({
                      title: '',
                      date: '',
                      month: 'JAN',
                      year: new Date().getFullYear(),
                      type: 'Festival',
                      description: '',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
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
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-all duration-200 border-orange-200/40 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-900 line-clamp-2">{event.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {event.type && (
                      <Badge className={`text-xs ${getTypeColor(event.type)}`}>
                        {event.type}
                      </Badge>
                    )}
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
              {event.description && (
                <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">{formatEventDate(event)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : events.length === 0 
                ? 'Click "Load Initial Events" button above to add pre-configured events, or create your first event'
                : 'Create your first event to get started'}
          </p>
        </div>
      )}
    </div>
  );
}
