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
  increment
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AudioContent, AudioSeries, ApiResponse, PaginatedResponse, QueryFilters } from '../types';
import { uploadService } from './uploadService';

class AudioService {
  private audioCollection = 'audio_contents';
  private seriesCollection = 'audio_series';
  private storageFolder = 'audio';

  // Audio Content Methods

  // Get all audio content with filters
  async getAudioContent(filters: QueryFilters = {}): Promise<PaginatedResponse<AudioContent>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        category,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      let q = query(collection(db, this.audioCollection));

      // Apply filters
      if (status && status !== 'all') {
        q = query(q, where('status', '==', status));
      }

      if (category && category !== 'all') {
        q = query(q, where('category', '==', category));
      }

      // Apply sorting
      q = query(q, orderBy(sortBy, sortOrder));

      // Apply pagination
      if (page > 1) {
        const previousPageQuery = query(
          collection(db, this.audioCollection),
          orderBy(sortBy, sortOrder),
          fbLimit((page - 1) * limit)
        );
        const previousDocs = await getDocs(previousPageQuery);
        const lastDoc = previousDocs.docs[previousDocs.docs.length - 1];
        if (lastDoc) {
          q = query(q, startAfter(lastDoc), fbLimit(limit));
        }
      } else {
        q = query(q, fbLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      let audioContent = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AudioContent[];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        audioContent = audioContent.filter(audio => 
          audio.title.toLowerCase().includes(searchLower) ||
          audio.description.toLowerCase().includes(searchLower) ||
          audio.textContent.toLowerCase().includes(searchLower) ||
          audio.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Get total count for pagination
      const totalQuery = query(collection(db, this.audioCollection));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        success: true,
        data: audioContent,
        total,
        page,
        limit,
        hasMore: audioContent.length === limit
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        hasMore: false
      };
    }
  }

  // Get audio content by ID
  async getAudio(id: string): Promise<ApiResponse<AudioContent>> {
    try {
      const docRef = doc(db, this.audioCollection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          } as AudioContent
        };
      } else {
        return {
          success: false,
          error: 'Audio content not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get audio content'
      };
    }
  }

  // Create new audio content
  async createAudio(audioData: Omit<AudioContent, 'id' | 'createdAt' | 'updatedAt' | 'playCount'>): Promise<ApiResponse<AudioContent>> {
    try {
      const now = new Date().toISOString();
      const newAudio = {
        ...audioData,
        playCount: 0,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.audioCollection), newAudio);
      
      // Update series audio count if it belongs to a series
      if (audioData.seriesId) {
        const seriesRef = doc(db, this.seriesCollection, audioData.seriesId);
        await updateDoc(seriesRef, {
          totalAudios: increment(1),
          updatedAt: now
        });
      }

      return {
        success: true,
        data: {
          id: docRef.id,
          ...newAudio
        } as AudioContent,
        message: 'Audio content created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create audio content'
      };
    }
  }

  // Update audio content
  async updateAudio(id: string, updates: Partial<AudioContent>): Promise<ApiResponse<AudioContent>> {
    try {
      const docRef = doc(db, this.audioCollection, id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);

      // Get updated document
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return {
          success: true,
          data: {
            id: updatedDoc.id,
            ...updatedDoc.data()
          } as AudioContent,
          message: 'Audio content updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Audio content not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update audio content'
      };
    }
  }

  // Delete audio content
  async deleteAudio(id: string): Promise<ApiResponse<null>> {
    try {
      // Get audio data first to update series count and delete files
      const audioResponse = await this.getAudio(id);
      if (!audioResponse.success || !audioResponse.data) {
        return {
          success: false,
          error: 'Audio content not found'
        };
      }

      const audio = audioResponse.data;

      // Delete associated audio file from Cloudinary or Firebase Storage
      if (audio.audioUrl) {
        try {
          await uploadService.deleteAudio(audio.audioUrl);
        } catch (audioError) {
          console.warn('Failed to delete audio file:', audioError);
        }
      }

      // Update series audio count if it belongs to a series
      if (audio.seriesId) {
        const seriesRef = doc(db, this.seriesCollection, audio.seriesId);
        await updateDoc(seriesRef, {
          totalAudios: increment(-1),
          updatedAt: new Date().toISOString()
        });
      }

      // Delete audio document
      const docRef = doc(db, this.audioCollection, id);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'Audio content deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete audio content'
      };
    }
  }

  // Upload audio file
  async uploadAudioFile(file: File, audioId?: string): Promise<ApiResponse<string>> {
    try {
      const result = await uploadService.uploadAudio(file, `audio/files/${audioId || Date.now()}`);
      
      return {
        success: result.success,
        data: result.url,
        message: result.success ? 'Audio file uploaded successfully' : undefined,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload audio file'
      };
    }
  }

  // Increment play count
  async incrementPlayCount(id: string): Promise<ApiResponse<null>> {
    try {
      const docRef = doc(db, this.audioCollection, id);
      await updateDoc(docRef, {
        playCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Play count updated'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update play count'
      };
    }
  }

  // Audio Series Methods

  // Get all audio series
  async getAudioSeries(): Promise<ApiResponse<AudioSeries[]>> {
    try {
      const q = query(
        collection(db, this.seriesCollection),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const series = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AudioSeries[];

      return {
        success: true,
        data: series
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get audio series'
      };
    }
  }

  // Get audio series by ID
  async getSeries(id: string): Promise<ApiResponse<AudioSeries>> {
    try {
      const docRef = doc(db, this.seriesCollection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          } as AudioSeries
        };
      } else {
        return {
          success: false,
          error: 'Audio series not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get audio series'
      };
    }
  }

  // Create new audio series
  async createSeries(seriesData: Omit<AudioSeries, 'id' | 'createdAt' | 'updatedAt' | 'totalAudios'>): Promise<ApiResponse<AudioSeries>> {
    try {
      const now = new Date().toISOString();
      const newSeries = {
        ...seriesData,
        totalAudios: 0,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.seriesCollection), newSeries);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...newSeries
        } as AudioSeries,
        message: 'Audio series created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create audio series'
      };
    }
  }

  // Update audio series
  async updateSeries(id: string, updates: Partial<AudioSeries>): Promise<ApiResponse<AudioSeries>> {
    try {
      const docRef = doc(db, this.seriesCollection, id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(docRef, updateData);

      // Get updated document
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return {
          success: true,
          data: {
            id: updatedDoc.id,
            ...updatedDoc.data()
          } as AudioSeries,
          message: 'Audio series updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Audio series not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update audio series'
      };
    }
  }

  // Delete audio series
  async deleteSeries(id: string): Promise<ApiResponse<null>> {
    try {
      // Get all audio content in this series
      const audioQuery = query(
        collection(db, this.audioCollection),
        where('seriesId', '==', id)
      );
      const audioSnapshot = await getDocs(audioQuery);

      // Delete all audio content in the series
      const deleteAudioPromises = audioSnapshot.docs.map(audioDoc => 
        this.deleteAudio(audioDoc.id)
      );
      await Promise.all(deleteAudioPromises);

      // Delete series document
      const docRef = doc(db, this.seriesCollection, id);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'Audio series and all associated content deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete audio series'
      };
    }
  }

  // Upload series cover image
  async uploadSeriesCover(file: File, seriesId: string): Promise<ApiResponse<string>> {
    try {
      const result = await uploadService.uploadImage(file, `audio/series_covers/${seriesId}`);
      
      if (result.success && result.url) {
        // Update series with new cover URL
        await this.updateSeries(seriesId, { coverImage: result.url });
        
        return {
          success: true,
          data: result.url,
          message: 'Series cover uploaded successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to upload series cover'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload series cover'
      };
    }
  }

  // Get audio content by series
  async getAudioBySeries(seriesId: string): Promise<ApiResponse<AudioContent[]>> {
    try {
      const q = query(
        collection(db, this.audioCollection),
        where('seriesId', '==', seriesId),
        orderBy('createdAt', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const audioContent = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AudioContent[];

      return {
        success: true,
        data: audioContent
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get audio by series'
      };
    }
  }

  // Get featured audio content
  async getFeaturedAudio(limit: number = 10): Promise<ApiResponse<AudioContent[]>> {
    try {
      const q = query(
        collection(db, this.audioCollection),
        where('featured', '==', true),
        where('status', '==', 'published'),
        orderBy('playCount', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const audioContent = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AudioContent[];

      return {
        success: true,
        data: audioContent
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get featured audio content'
      };
    }
  }

  // Get audio statistics
  async getAudioStats(): Promise<ApiResponse<{
    totalAudio: number;
    totalSeries: number;
    published: number;
    draft: number;
    archived: number;
    totalPlays: number;
    bhajanCount: number;
    aiCount: number;
  }>> {
    try {
      const [audioSnapshot, seriesSnapshot] = await Promise.all([
        getDocs(collection(db, this.audioCollection)),
        getDocs(collection(db, this.seriesCollection))
      ]);

      const audioContent = audioSnapshot.docs.map(doc => doc.data()) as AudioContent[];

      const stats = {
        totalAudio: audioContent.length,
        totalSeries: seriesSnapshot.size,
        published: audioContent.filter(a => a.status === 'published').length,
        draft: audioContent.filter(a => a.status === 'draft').length,
        archived: audioContent.filter(a => a.status === 'archived').length,
        totalPlays: audioContent.reduce((sum, audio) => sum + (audio.playCount || 0), 0),
        bhajanCount: audioContent.filter(a => a.category === 'bhajan').length,
        aiCount: audioContent.filter(a => a.category === 'ai').length
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get audio statistics'
      };
    }
  }

  // Toggle featured status
  async toggleFeatured(id: string): Promise<ApiResponse<AudioContent>> {
    try {
      const audioResponse = await this.getAudio(id);
      if (!audioResponse.success || !audioResponse.data) {
        return {
          success: false,
          error: 'Audio content not found'
        };
      }

      const audio = audioResponse.data;
      return await this.updateAudio(id, { featured: !audio.featured });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to toggle featured status'
      };
    }
  }

  // Real-time: subscribe to audio content
  subscribeToAudioContent(filters: QueryFilters = {}, callback: (audio: AudioContent[]) => void) {
    const {
      search,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50
    } = filters;

    let q = query(collection(db, this.audioCollection));
    if (status && status !== 'all') q = query(q, where('status', '==', status));
    if (category && category !== 'all') q = query(q, where('category', '==', category));
    q = query(q, orderBy(sortBy, sortOrder), fbLimit(limit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AudioContent[];
      if (search) {
        const s = search.toLowerCase();
        items = items.filter(a =>
          a.title.toLowerCase().includes(s) ||
          a.description.toLowerCase().includes(s) ||
          a.textContent.toLowerCase().includes(s) ||
          a.tags.some(tag => tag.toLowerCase().includes(s))
        );
      }
      callback(items);
    });

    return unsubscribe;
  }

  // Real-time: subscribe to single audio item
  subscribeToAudio(id: string, callback: (audio: AudioContent | null) => void) {
    const ref = doc(db, this.audioCollection, id);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as AudioContent);
      } else {
        callback(null);
      }
    });
  }

  // Real-time: subscribe to series
  subscribeToSeries(callback: (series: AudioSeries[]) => void) {
    const q = query(collection(db, this.seriesCollection), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AudioSeries[];
      callback(list);
    });
  }
}

export const audioService = new AudioService();