import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as fbLimit,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CalendarEvent, ApiResponse, PaginatedResponse, QueryFilters } from '../types';

class CalendarService {
  private collectionName = 'calendarEvents';
  private legacyCollectionName = 'calendar_events';

  // Get all events with filters
  async getEvents(filters: QueryFilters = {}): Promise<PaginatedResponse<CalendarEvent>> {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        status,
        category,
        sortBy = 'date',
        sortOrder = 'asc'
      } = filters;

      let q = query(collection(db, this.collectionName));

      // Apply filters
      if (status && status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }

      // No server-side sort or offset pagination to avoid composite index issues
      q = query(q, fbLimit(limit));

      let querySnapshot = await getDocs(q);
      
      // Fallback to legacy collection name if empty
      if (querySnapshot.empty) {
        let qLegacy = query(collection(db, this.legacyCollectionName), fbLimit(limit));
        if (status && status !== 'all') qLegacy = query(qLegacy, where('status', '==', status));
        if (category && category !== 'all') qLegacy = query(qLegacy, where('category', '==', category));
        querySnapshot = await getDocs(qLegacy);
      }

      let events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CalendarEvent[];

      // Apply search filter (client-side)
      if (search) {
        const searchLower = search.toLowerCase();
        events = events.filter(event => 
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          (event.location && event.location.toLowerCase().includes(searchLower))
        );
      }

      // Client-side sort by date (default asc)
      events = events.sort((a, b) => {
        const aVal = (a as any)[sortBy] ?? '';
        const bVal = (b as any)[sortBy] ?? '';
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortOrder === 'desc' ? -cmp : cmp;
      });

      // Get total count for pagination (best-effort)
      const totalSnapshot = await getDocs(query(collection(db, this.collectionName)));
      const legacyTotalSnapshot = await getDocs(query(collection(db, this.legacyCollectionName)));
      const totalCount = totalSnapshot.size || legacyTotalSnapshot.size;

      return { success: true, data: events, total: totalCount, page, limit, hasMore: events.length === limit };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false,
        error: error?.message || 'Failed to load events',
      } as any;
    }
  }

  // Get event by ID
  async getEvent(id: string): Promise<ApiResponse<CalendarEvent>> {
    try {
      let docSnap = await getDoc(doc(db, this.collectionName, id));
      if (!docSnap.exists()) {
        docSnap = await getDoc(doc(db, this.legacyCollectionName, id));
      }

      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          } as CalendarEvent
        };
      } else {
        return {
          success: false,
          error: 'Event not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get event'
      };
    }
  }

  // Create new event
  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<CalendarEvent>> {
    try {
      const now = new Date().toISOString();
      const uid = (await import('../lib/firebase')).auth.currentUser?.uid || null;
      const newEvent: any = {
        ...eventData,
        createdAt: now,
        updatedAt: now,
        createdBy: uid,
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, this.collectionName), newEvent);
      } catch {
        // fallback to legacy collection name
        docRef = await addDoc(collection(db, this.legacyCollectionName), newEvent);
      }
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...newEvent
        } as CalendarEvent,
        message: 'Event created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create event'
      };
    }
  }

  // Update event
  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<ApiResponse<CalendarEvent>> {
    try {
      const updateData = { ...updates, updatedAt: new Date().toISOString() };

      let updatedDoc = await getDoc(doc(db, this.collectionName, id));
      if (updatedDoc.exists()) {
        await updateDoc(doc(db, this.collectionName, id), updateData);
        updatedDoc = await getDoc(doc(db, this.collectionName, id));
      } else {
        await updateDoc(doc(db, this.legacyCollectionName, id), updateData);
        updatedDoc = await getDoc(doc(db, this.legacyCollectionName, id));
      }
      if (updatedDoc.exists()) {
        return {
          success: true,
          data: {
            id: updatedDoc.id,
            ...updatedDoc.data()
          } as CalendarEvent,
          message: 'Event updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Event not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update event'
      };
    }
  }

  // Delete event
  async deleteEvent(id: string): Promise<ApiResponse<null>> {
    try {
      // Try primary then legacy
      try {
        await deleteDoc(doc(db, this.collectionName, id));
      } catch {
        await deleteDoc(doc(db, this.legacyCollectionName, id));
      }

      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete event'
      };
    }
  }

  // Get events by date range
  async getEventsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<CalendarEvent[]>> {
    try {
      // Avoid composite index by removing orderBy and sorting client-side; include legacy fallback
      let q = query(
        collection(db, this.collectionName),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      let querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        let qLegacy = query(
          collection(db, this.legacyCollectionName),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );
        querySnapshot = await getDocs(qLegacy);
      }
      let events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CalendarEvent[];
      events = events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      return { success: true, data: events };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get events by date range'
      };
    }
  }

  // Get upcoming events
  async getUpcomingEvents(limit: number = 10): Promise<ApiResponse<CalendarEvent[]>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      // Avoid composite index: drop orderBy and 'in' with client-side filter/sort; include legacy fallback
      let q = query(
        collection(db, this.collectionName),
        where('date', '>=', today)
      );
      let querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        q = query(collection(db, this.legacyCollectionName), where('date', '>=', today));
        querySnapshot = await getDocs(q);
      }
      let events = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CalendarEvent[];
      events = events
        .filter(e => ['scheduled', 'ongoing'].includes(e.status))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
        .slice(0, limit);

      return { success: true, data: events };

      return {
        success: true,
        data: events
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get upcoming events'
      };
    }
  }

  // Update event status
  async updateEventStatus(id: string, status: CalendarEvent['status']): Promise<ApiResponse<CalendarEvent>> {
    try {
      return await this.updateEvent(id, { status });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update event status'
      };
    }
  }

  // Get events statistics
  async getEventsStats(): Promise<ApiResponse<{
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
  }>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const events = querySnapshot.docs.map(doc => doc.data()) as CalendarEvent[];

      const now = new Date();
      const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const stats = {
        total: events.length,
        scheduled: events.filter(e => e.status === 'scheduled').length,
        ongoing: events.filter(e => e.status === 'ongoing').length,
        completed: events.filter(e => e.status === 'completed').length,
        cancelled: events.filter(e => e.status === 'cancelled').length,
        thisMonth: events.filter(e => e.createdAt.startsWith(thisMonth)).length
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get events statistics'
      };
    }
  }
}

export const calendarService = new CalendarService();