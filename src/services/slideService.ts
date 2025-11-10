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
import { db } from '../lib/firebase';
import { SlideContent, ApiResponse, PaginatedResponse, QueryFilters } from '../types';
import { uploadService } from './uploadService';

class SlideService {
  private collectionName = 'slide_contents';
  private storageFolder = 'slides';

  // Get all slides with filters
  async getSlides(filters: QueryFilters = {}): Promise<PaginatedResponse<SlideContent>> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        status,
        category,
        sortBy = 'priority',
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
      let slides = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SlideContent[];

      // Apply search filter (client-side for multilingual search)
      if (search) {
        const searchLower = search.toLowerCase();
        slides = slides.filter(slide => 
          slide.title.hindi.toLowerCase().includes(searchLower) ||
          slide.title.english.toLowerCase().includes(searchLower) ||
          slide.description.hindi.toLowerCase().includes(searchLower) ||
          slide.description.english.toLowerCase().includes(searchLower)
        );
      }

      // Get total count for pagination
      const totalQuery = query(collection(db, this.collectionName));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        success: true,
        data: slides,
        total,
        page,
        limit,
        hasMore: slides.length === limit
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

  // Get slide by ID
  async getSlide(id: string): Promise<ApiResponse<SlideContent>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          data: {
            id: docSnap.id,
            ...docSnap.data()
          } as SlideContent
        };
      } else {
        return {
          success: false,
          error: 'Slide not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get slide'
      };
    }
  }

  // Create new slide
  async createSlide(slideData: Omit<SlideContent, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>): Promise<ApiResponse<SlideContent>> {
    try {
      const now = new Date().toISOString();
      const uid = (await import('../lib/firebase')).auth.currentUser?.uid || null;
      const newSlide: any = {
        ...slideData,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: uid,
      };

      const docRef = await addDoc(collection(db, this.collectionName), newSlide);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...newSlide
        } as SlideContent,
        message: 'Slide created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create slide'
      };
    }
  }

  // Update slide
  async updateSlide(id: string, updates: Partial<SlideContent>): Promise<ApiResponse<SlideContent>> {
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
          } as SlideContent,
          message: 'Slide updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Slide not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update slide'
      };
    }
  }

  // Delete slide
  async deleteSlide(id: string): Promise<ApiResponse<null>> {
    try {
      // Get slide data first to delete associated image
      const slideResponse = await this.getSlide(id);
      if (!slideResponse.success || !slideResponse.data) {
        return {
          success: false,
          error: 'Slide not found'
        };
      }

      // Delete associated image from Cloudinary or Firebase Storage
      const slide = slideResponse.data;
      if (slide.imageUrl) {
        try {
          await uploadService.deleteImage(slide.imageUrl);
        } catch (imageError) {
          // Image deletion failed, but continue with slide deletion
          console.warn('Failed to delete slide image:', imageError);
        }
      }

      // Delete slide document
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'Slide deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete slide'
      };
    }
  }

  // Upload slide image
  async uploadSlideImage(file: File, slideId?: string): Promise<ApiResponse<string>> {
    try {
      const result = await uploadService.uploadImage(file, `slides/${slideId || Date.now()}`);
      
      return {
        success: result.success,
        data: result.url,
        message: result.success ? 'Image uploaded successfully' : undefined,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  }

  // Increment view count
  async incrementViewCount(id: string): Promise<ApiResponse<null>> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        viewCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'View count updated'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update view count'
      };
    }
  }

  // Get featured slides
  async getFeaturedSlides(limit: number = 10): Promise<ApiResponse<SlideContent[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('featured', '==', true),
        where('status', '==', 'published'),
        orderBy('priority', 'asc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const slides = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SlideContent[];

      return {
        success: true,
        data: slides
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get featured slides'
      };
    }
  }

  // Get slides by category
  async getSlidesByCategory(category: SlideContent['category'], limit: number = 20): Promise<ApiResponse<SlideContent[]>> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('category', '==', category),
        where('status', '==', 'published'),
        orderBy('priority', 'asc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const slides = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SlideContent[];

      return {
        success: true,
        data: slides
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get slides by category'
      };
    }
  }

  // Toggle featured status
  async toggleFeatured(id: string): Promise<ApiResponse<SlideContent>> {
    try {
      const slideResponse = await this.getSlide(id);
      if (!slideResponse.success || !slideResponse.data) {
        return {
          success: false,
          error: 'Slide not found'
        };
      }

      const slide = slideResponse.data;
      return await this.updateSlide(id, { featured: !slide.featured });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to toggle featured status'
      };
    }
  }

  // Get slides statistics
  async getSlidesStats(): Promise<ApiResponse<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    featured: number;
    totalViews: number;
  }>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const slides = querySnapshot.docs.map(doc => doc.data()) as SlideContent[];

      const stats = {
        total: slides.length,
        published: slides.filter(s => s.status === 'published').length,
        draft: slides.filter(s => s.status === 'draft').length,
        archived: slides.filter(s => s.status === 'archived').length,
        featured: slides.filter(s => s.featured).length,
        totalViews: slides.reduce((sum, slide) => sum + (slide.viewCount || 0), 0)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get slides statistics'
      };
    }
  }

  // Bulk update slides
  async bulkUpdateSlides(ids: string[], updates: Partial<SlideContent>): Promise<ApiResponse<number>> {
    try {
      let updatedCount = 0;
      const updatePromises = ids.map(async (id) => {
        try {
          await this.updateSlide(id, updates);
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update slide ${id}:`, error);
        }
      });

      await Promise.all(updatePromises);

      return {
        success: true,
        data: updatedCount,
        message: `Successfully updated ${updatedCount} slides`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to bulk update slides'
      };
    }
  }
}

export const slideService = new SlideService();