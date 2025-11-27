import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit as fbLimit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadService } from './uploadService';
import type { ApiResponse, PaginatedResponse, MiddleSlide, QueryFilters } from '../types';

class MiddleSlideService {
  private collectionName = 'middle_slides';

  async getMiddleSlides(filters: QueryFilters = {}): Promise<PaginatedResponse<MiddleSlide>> {
    try {
      const { page = 1, limit = 50, status, sortBy = 'priority', sortOrder = 'asc' } = filters;

      let q = query(collection(db, this.collectionName));
      if (status && status !== 'all') q = query(q, where('status', '==', status));
      q = query(q, orderBy(sortBy, sortOrder));

      if (page > 1) {
        const prevQ = query(collection(db, this.collectionName), orderBy(sortBy, sortOrder), fbLimit((page - 1) * limit));
        const prevDocs = await getDocs(prevQ);
        const lastDoc = prevDocs.docs[prevDocs.docs.length - 1];
        if (lastDoc) q = query(q, startAfter(lastDoc), fbLimit(limit));
      } else {
        q = query(q, fbLimit(limit));
      }

      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MiddleSlide[];

      const totalSnap = await getDocs(query(collection(db, this.collectionName)));
      return { success: true, data: items, total: totalSnap.size, page, limit, hasMore: items.length === limit };
    } catch (e: any) {
      return { success: false, data: [], total: 0, page: 1, limit: 50, hasMore: false };
    }
  }

  async getMiddleSlide(id: string): Promise<ApiResponse<MiddleSlide>> {
    try {
      const ref = doc(db, this.collectionName, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return { success: false, error: 'Middle slide not found' };
      return { success: true, data: { id: snap.id, ...snap.data() } as MiddleSlide };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to get middle slide' };
    }
  }

  async createMiddleSlide(data: Omit<MiddleSlide, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MiddleSlide>> {
    try {
      const now = new Date().toISOString();
      const uid = (await import('../lib/firebase')).auth.currentUser?.uid || null;
      const payload: any = { ...data, createdAt: now, updatedAt: now, createdBy: uid };
      const ref = await addDoc(collection(db, this.collectionName), payload);
      return { success: true, data: { id: ref.id, ...payload } as MiddleSlide, message: 'Middle slide created' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to create middle slide' };
    }
  }

  async updateMiddleSlide(id: string, updates: Partial<MiddleSlide>): Promise<ApiResponse<MiddleSlide>> {
    try {
      const ref = doc(db, this.collectionName, id);
      await updateDoc(ref, { ...updates, updatedAt: new Date().toISOString() });
      const snap = await getDoc(ref);
      return { success: true, data: { id: snap.id, ...snap.data() } as MiddleSlide, message: 'Middle slide updated' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update middle slide' };
    }
  }

  async deleteMiddleSlide(id: string): Promise<ApiResponse<null>> {
    try {
      const ref = doc(db, this.collectionName, id);
      const slide = await getDoc(ref);
      const data = slide.data() as any;
      if (data?.imageUrl) {
        // Handle both old format (string) and new format (object with hindi/english)
        if (typeof data.imageUrl === 'string') {
          try { await uploadService.deleteImage(data.imageUrl); } catch {}
        } else if (data.imageUrl.hindi) {
          try { await uploadService.deleteImage(data.imageUrl.hindi); } catch {}
        }
        if (data.imageUrl.english) {
          try { await uploadService.deleteImage(data.imageUrl.english); } catch {}
        }
      }
      await deleteDoc(ref);
      return { success: true, message: 'Middle slide deleted' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to delete middle slide' };
    }
  }

  async uploadMiddleSlideImage(file: File, slideId?: string) {
    try {
      const result = await uploadService.uploadImage(file, `slides/middle/${slideId || Date.now()}`);
      return { success: result.success, data: result.url, error: result.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  async toggleFeatured(id: string): Promise<ApiResponse<MiddleSlide>> {
    try {
      const cur = await this.getMiddleSlide(id);
      if (!cur.success || !cur.data) return { success: false, error: 'Not found' };
      return await this.updateMiddleSlide(id, { featured: !cur.data.featured });
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to toggle featured' };
    }
  }
}

export const middleSlideService = new MiddleSlideService();
