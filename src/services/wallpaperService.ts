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
import { Wallpaper, ApiResponse, PaginatedResponse, QueryFilters } from '../types';
import { uploadService } from './uploadService';

class WallpaperService {
  private collectionName = 'wallpapers';
  private storageFolder = 'wallpapers';

  // Get all wallpapers with filters
  async getWallpapers(filters: QueryFilters = {}): Promise<PaginatedResponse<Wallpaper>> {
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

      let q = query(collection(db, this.collectionName));

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
          collection(db, this.collectionName),
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
      let wallpapers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        wallpapers = wallpapers.filter(wallpaper => 
          wallpaper.title.toLowerCase().includes(searchLower) ||
          wallpaper.description.toLowerCase().includes(searchLower) ||
          wallpaper.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      // Get total count for pagination
      const totalQuery = query(collection(db, this.collectionName));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        success: true,
        data: wallpapers,
        total,
        page,
        limit,
        hasMore: wallpapers.length === limit
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

  // Get wallpaper by ID
  async getWallpaper(id: string): Promise<ApiResponse<Wallpaper>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          } as Wallpaper
        };
      } else {
        return {
          success: false,
          error: 'Wallpaper not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get wallpaper'
      };
    }
  }

  // Create new wallpaper
  async createWallpaper(wallpaperData: Omit<Wallpaper, 'id' | 'createdAt' | 'updatedAt' | 'downloadCount'>): Promise<ApiResponse<Wallpaper>> {
    try {
      const now = new Date().toISOString();
      const newWallpaper = {
        ...wallpaperData,
        downloadCount: 0,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.collectionName), newWallpaper);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...newWallpaper
        } as Wallpaper,
        message: 'Wallpaper created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create wallpaper'
      };
    }
  }

  // Update wallpaper
  async updateWallpaper(id: string, updates: Partial<Wallpaper>): Promise<ApiResponse<Wallpaper>> {
    try {
      const docRef = doc(db, this.collectionName, id);
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
          } as Wallpaper,
          message: 'Wallpaper updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Wallpaper not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update wallpaper'
      };
    }
  }

  // Delete wallpaper
  async deleteWallpaper(id: string): Promise<ApiResponse<null>> {
    try {
      // Get wallpaper data first to delete associated image
      const wallpaperResponse = await this.getWallpaper(id);
      if (!wallpaperResponse.success || !wallpaperResponse.data) {
        return {
          success: false,
          error: 'Wallpaper not found'
        };
      }

      // Delete associated image from Cloudinary or Firebase Storage
      const wallpaper = wallpaperResponse.data;
      if (wallpaper.imageUrl) {
        try {
          await uploadService.deleteImage(wallpaper.imageUrl);
        } catch (imageError) {
          // Image deletion failed, but continue with wallpaper deletion
          console.warn('Failed to delete wallpaper image:', imageError);
        }
      }

      // Delete wallpaper document
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'Wallpaper deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete wallpaper'
      };
    }
  }

  // Upload wallpaper image
  async uploadWallpaperImage(file: File, wallpaperId: string) {
    try {
      const result = await uploadService.uploadImage(file, `wallpapers/${wallpaperId}`);
      return { success: result.success, data: result.url, error: result.error };
    } catch (error: any) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }
  }

  // Increment download count
  async incrementDownloadCount(id: string): Promise<ApiResponse<null>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        downloadCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Download count updated'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update download count'
      };
    }
  }

  // Get featured wallpapers
  async getFeaturedWallpapers(limit: number = 10): Promise<ApiResponse<Wallpaper[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('featured', '==', true),
        where('status', '==', 'published'),
        orderBy('downloadCount', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const wallpapers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];

      return {
        success: true,
        data: wallpapers
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get featured wallpapers'
      };
    }
  }

  // Get wallpapers by category
  async getWallpapersByCategory(category: Wallpaper['category'], limit: number = 20): Promise<ApiResponse<Wallpaper[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('category', '==', category),
        where('status', '==', 'published'),
        orderBy('downloadCount', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const wallpapers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];

      return {
        success: true,
        data: wallpapers
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get wallpapers by category'
      };
    }
  }

  // Search wallpapers by tags
  async searchByTags(tags: string[], limit: number = 20): Promise<ApiResponse<Wallpaper[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('tags', 'array-contains-any', tags),
        where('status', '==', 'published'),
        orderBy('downloadCount', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const wallpapers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];

      return {
        success: true,
        data: wallpapers
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to search wallpapers by tags'
      };
    }
  }

  // Toggle featured status
  async toggleFeatured(id: string): Promise<ApiResponse<Wallpaper>> {
    try {
      const wallpaperResponse = await this.getWallpaper(id);
      if (!wallpaperResponse.success || !wallpaperResponse.data) {
        return {
          success: false,
          error: 'Wallpaper not found'
        };
      }

      const wallpaper = wallpaperResponse.data;
      return await this.updateWallpaper(id, { featured: !wallpaper.featured });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to toggle featured status'
      };
    }
  }

  // Get popular wallpapers (by download count)
  async getPopularWallpapers(limit: number = 10): Promise<ApiResponse<Wallpaper[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'published'),
        orderBy('downloadCount', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const wallpapers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];

      return {
        success: true,
        data: wallpapers
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get popular wallpapers'
      };
    }
  }

  // Get recent wallpapers
  async getRecentWallpapers(limit: number = 10): Promise<ApiResponse<Wallpaper[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const wallpapers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];

      return {
        success: true,
        data: wallpapers
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get recent wallpapers'
      };
    }
  }

  // Get wallpapers statistics
  async getWallpapersStats(): Promise<ApiResponse<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    featured: number;
    totalDownloads: number;
    categoryCounts: { [key: string]: number };
    topTags: Array<{ tag: string; count: number }>;
  }>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const wallpapers = querySnapshot.docs.map(doc => doc.data()) as Wallpaper[];

      // Category counts
      const categoryCounts: { [key: string]: number } = {};
      wallpapers.forEach(wallpaper => {
        const category = wallpaper.category;
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      // Tag analysis
      const tagCounts: { [key: string]: number } = {};
      wallpapers.forEach(wallpaper => {
        wallpaper.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      const stats = {
        total: wallpapers.length,
        published: wallpapers.filter(w => w.status === 'published').length,
        draft: wallpapers.filter(w => w.status === 'draft').length,
        archived: wallpapers.filter(w => w.status === 'archived').length,
        featured: wallpapers.filter(w => w.featured).length,
        totalDownloads: wallpapers.reduce((sum, wallpaper) => sum + (wallpaper.downloadCount || 0), 0),
        categoryCounts,
        topTags
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get wallpapers statistics'
      };
    }
  }

  // Bulk update wallpapers
  async bulkUpdateWallpapers(ids: string[], updates: Partial<Wallpaper>): Promise<ApiResponse<number>> {
    try {
      let updatedCount = 0;
      const updatePromises = ids.map(async (id) => {
        try {
          await this.updateWallpaper(id, updates);
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update wallpaper ${id}:`, error);
        }
      });

      await Promise.all(updatePromises);

      return {
        success: true,
        data: updatedCount,
        message: `Successfully updated ${updatedCount} wallpapers`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to bulk update wallpapers'
      };
    }
  }

  // Get wallpapers by resolution
  async getWallpapersByResolution(resolution: string): Promise<ApiResponse<Wallpaper[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('resolution', '==', resolution),
        where('status', '==', 'published'),
        orderBy('downloadCount', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const wallpapers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Wallpaper[];

      return {
        success: true,
        data: wallpapers
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get wallpapers by resolution'
      };
    }
  }

  // Real-time: subscribe to wallpapers list
  subscribeToWallpapers(filters: QueryFilters = {}, callback: (wallpapers: Wallpaper[]) => void) {
    const {
      search,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50
    } = filters;

    let q = query(collection(db, this.collectionName));
    if (status && status !== 'all') q = query(q, where('status', '==', status));
    if (category && category !== 'all') q = query(q, where('category', '==', category));
    q = query(q, orderBy(sortBy, sortOrder), fbLimit(limit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Wallpaper[];
      if (search) {
        const s = search.toLowerCase();
        items = items.filter(w =>
          w.title.toLowerCase().includes(s) ||
          w.description.toLowerCase().includes(s) ||
          w.tags.some(tag => tag.toLowerCase().includes(s))
        );
      }
      callback(items);
    });

    return unsubscribe;
  }

  // Real-time: subscribe to single wallpaper
  subscribeToWallpaper(id: string, callback: (wallpaper: Wallpaper | null) => void) {
    const ref = doc(db, this.collectionName, id);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Wallpaper);
      } else {
        callback(null);
      }
    });
  }
}

export const wallpaperService = new WallpaperService();