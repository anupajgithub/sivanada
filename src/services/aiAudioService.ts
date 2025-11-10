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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ApiResponse } from '../types';
import { uploadService } from './uploadService';

export interface AIAudioCategory {
  id: string;
  name: string;
  description: string;
  status: 'Published' | 'Draft';
  createdAt: string;
  updatedAt?: string;
}

export interface AIAudioChapter {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AIAudioItem {
  id: string;
  chapterId: string;
  categoryId: string;
  title: string;
  text: string;
  audioFile?: string;
  audioUrl?: string;
  duration?: string;
  status: 'Published' | 'Draft';
  order: number;
  createdAt: string;
  updatedAt?: string;
}

class AIAudioService {
  private categoriesCollection = 'aiAudioCategories';
  private chaptersCollection = 'aiAudioChapters';
  private audioItemsCollection = 'aiAudioItems';
  private storageFolder = 'ai-audio';

  // ==================== CATEGORY APIs ====================
  
  /**
   * Get all AI audio categories
   * GET /api/ai-audio/categories
   */
  async getAllCategories(): Promise<ApiResponse<AIAudioCategory[]>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.categoriesCollection));
      
      const categories = (querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]).sort((a, b) => {
        const toMs = (v: any) => {
          if (!v) return 0;
          if (typeof v === 'string') return Date.parse(v) || 0;
          if (v?.toDate) return v.toDate().getTime();
          if (v instanceof Date) return v.getTime();
          return 0;
        };
        return toMs(b.createdAt) - toMs(a.createdAt);
      });
      
      return {
        success: true,
        data: categories as AIAudioCategory[]
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch categories'
      };
    }
  }

  /**
   * Get a single category by ID
   * GET /api/ai-audio/categories/:id
   */
  async getCategoryById(categoryId: string): Promise<ApiResponse<AIAudioCategory>> {
    try {
      const docRef = doc(db, this.categoriesCollection, categoryId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Category not found'
        };
      }
      
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() } as AIAudioCategory
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch category'
      };
    }
  }

  /**
   * Create a new category
   * POST /api/ai-audio/categories
   * Body: { name, description, status }
   */
  async createCategory(categoryData: Omit<AIAudioCategory, 'id' | 'createdAt'>): Promise<ApiResponse<AIAudioCategory>> {
    try {
      const newCategory = {
        ...categoryData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, this.categoriesCollection), newCategory);
      
      return {
        success: true,
        data: { id: docRef.id, ...newCategory } as AIAudioCategory,
        message: 'Category created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create category'
      };
    }
  }

  /**
   * Update an existing category
   * PUT /api/ai-audio/categories/:id
   * Body: { name?, description?, status? }
   */
  async updateCategory(categoryId: string, updates: Partial<AIAudioCategory>): Promise<ApiResponse<AIAudioCategory>> {
    try {
      const docRef = doc(db, this.categoriesCollection, categoryId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      
      return {
        success: true,
        data: { id: updatedDoc.id, ...updatedDoc.data() } as AIAudioCategory,
        message: 'Category updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update category'
      };
    }
  }

  /**
   * Delete a category
   * DELETE /api/ai-audio/categories/:id
   */
  async deleteCategory(categoryId: string): Promise<ApiResponse<null>> {
    try {
      // Delete all chapters and audio items in this category first
      const chaptersSnapshot = await getDocs(
        query(collection(db, this.chaptersCollection), where('categoryId', '==', categoryId))
      );
      
      for (const chapterDoc of chaptersSnapshot.docs) {
        await this.deleteChapter(chapterDoc.id);
      }
      
      // Delete the category
      await deleteDoc(doc(db, this.categoriesCollection, categoryId));
      
      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete category'
      };
    }
  }

  // ==================== CHAPTER APIs ====================
  
  /**
   * Get all chapters for a category
   * GET /api/ai-audio/categories/:categoryId/chapters
   */
  async getChaptersByCategory(categoryId: string): Promise<ApiResponse<AIAudioChapter[]>> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.chaptersCollection),
          where('categoryId', '==', categoryId)
        )
      );
      
      const chapters = (querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]).sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : parseInt(a.order || '0', 10) || 0;
        const bo = typeof b.order === 'number' ? b.order : parseInt(b.order || '0', 10) || 0;
        return ao - bo;
      }) as AIAudioChapter[];
      
      return {
        success: true,
        data: chapters
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch chapters'
      };
    }
  }

  /**
   * Get a single chapter by ID
   * GET /api/ai-audio/chapters/:id
   */
  async getChapterById(chapterId: string): Promise<ApiResponse<AIAudioChapter>> {
    try {
      const docRef = doc(db, this.chaptersCollection, chapterId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Chapter not found'
        };
      }
      
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() } as AIAudioChapter
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch chapter'
      };
    }
  }

  /**
   * Create a new chapter
   * POST /api/ai-audio/categories/:categoryId/chapters
   * Body: { title, description, order }
   */
  async createChapter(chapterData: Omit<AIAudioChapter, 'id' | 'createdAt'>): Promise<ApiResponse<AIAudioChapter>> {
    try {
      const newChapter = {
        ...chapterData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, this.chaptersCollection), newChapter);
      
      return {
        success: true,
        data: { id: docRef.id, ...newChapter } as AIAudioChapter,
        message: 'Chapter created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create chapter'
      };
    }
  }

  /**
   * Update an existing chapter
   * PUT /api/ai-audio/chapters/:id
   * Body: { title?, description?, order? }
   */
  async updateChapter(chapterId: string, updates: Partial<AIAudioChapter>): Promise<ApiResponse<AIAudioChapter>> {
    try {
      const docRef = doc(db, this.chaptersCollection, chapterId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      
      return {
        success: true,
        data: { id: updatedDoc.id, ...updatedDoc.data() } as AIAudioChapter,
        message: 'Chapter updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update chapter'
      };
    }
  }

  /**
   * Delete a chapter
   * DELETE /api/ai-audio/chapters/:id
   */
  async deleteChapter(chapterId: string): Promise<ApiResponse<null>> {
    try {
      // Delete all audio items in this chapter first
      const audioItemsSnapshot = await getDocs(
        query(collection(db, this.audioItemsCollection), where('chapterId', '==', chapterId))
      );
      
      for (const audioDoc of audioItemsSnapshot.docs) {
        await this.deleteAudioItem(audioDoc.id);
      }
      
      // Delete the chapter
      await deleteDoc(doc(db, this.chaptersCollection, chapterId));
      
      return {
        success: true,
        message: 'Chapter deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete chapter'
      };
    }
  }

  // ==================== AUDIO ITEM APIs ====================
  
  /**
   * Get all audio items for a chapter
   * GET /api/ai-audio/chapters/:chapterId/items
   */
  async getAudioItemsByChapter(chapterId: string): Promise<ApiResponse<AIAudioItem[]>> {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, this.audioItemsCollection),
          where('chapterId', '==', chapterId)
        )
      );
      
      const audioItems = (querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[]).sort((a, b) => {
        const ao = typeof a.order === 'number' ? a.order : parseInt(a.order || '0', 10) || 0;
        const bo = typeof b.order === 'number' ? b.order : parseInt(b.order || '0', 10) || 0;
        return ao - bo;
      }) as AIAudioItem[];
      
      return {
        success: true,
        data: audioItems
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch audio items'
      };
    }
  }

  /**
   * Get a single audio item by ID
   * GET /api/ai-audio/items/:id
   */
  async getAudioItemById(itemId: string): Promise<ApiResponse<AIAudioItem>> {
    try {
      const docRef = doc(db, this.audioItemsCollection, itemId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return {
          success: false,
          error: 'Audio item not found'
        };
      }
      
      return {
        success: true,
        data: { id: docSnap.id, ...docSnap.data() } as AIAudioItem
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch audio item'
      };
    }
  }

  /**
   * Create a new audio item
   * POST /api/ai-audio/chapters/:chapterId/items
   * Body: { title, text, audioFile?, status, order }
   */
  async createAudioItem(itemData: Omit<AIAudioItem, 'id' | 'createdAt' | 'audioUrl'>): Promise<ApiResponse<AIAudioItem>> {
    try {
      const newItem = {
        ...itemData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, this.audioItemsCollection), newItem);
      
      return {
        success: true,
        data: { id: docRef.id, ...newItem } as AIAudioItem,
        message: 'Audio item created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create audio item'
      };
    }
  }

  /**
   * Update an existing audio item
   * PUT /api/ai-audio/items/:id
   * Body: { title?, text?, status?, order? }
   */
  async updateAudioItem(itemId: string, updates: Partial<AIAudioItem>): Promise<ApiResponse<AIAudioItem>> {
    try {
      const docRef = doc(db, this.audioItemsCollection, itemId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      
      return {
        success: true,
        data: { id: updatedDoc.id, ...updatedDoc.data() } as AIAudioItem,
        message: 'Audio item updated successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update audio item'
      };
    }
  }

  /**
   * Delete an audio item
   * DELETE /api/ai-audio/items/:id
   */
  async deleteAudioItem(itemId: string): Promise<ApiResponse<null>> {
    try {
      // Get the audio item to delete associated file
      const itemDoc = await getDoc(doc(db, this.audioItemsCollection, itemId));
      
      if (itemDoc.exists()) {
        const itemData = itemDoc.data() as AIAudioItem;
        
        // Delete audio file from Cloudinary or Firebase Storage
        if (itemData.audioFile || itemData.audioUrl) {
          try {
            if (itemData.audioUrl) {
              await uploadService.deleteAudio(itemData.audioUrl);
            }
          } catch (error) {
            console.error('Error deleting audio file:', error);
          }
        }
      }
      
      // Delete the audio item
      await deleteDoc(doc(db, this.audioItemsCollection, itemId));
      
      return {
        success: true,
        message: 'Audio item deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete audio item'
      };
    }
  }

  /**
   * Upload audio file for an audio item
   * POST /api/ai-audio/items/:id/upload-audio
   * Body: FormData with 'audio' file
   */
  async uploadAudioFile(itemId: string, file: File): Promise<ApiResponse<{ audioUrl: string; audioFile: string }>> {
    try {
      const result = await uploadService.uploadAudio(file, `ai-audio/${itemId}`);
      
      if (result.success && result.url) {
        // Update audio item with file info
        await updateDoc(doc(db, this.audioItemsCollection, itemId), {
          audioFile: file.name,
          audioUrl: result.url,
          updatedAt: new Date().toISOString()
        });
        
        return {
          success: true,
          data: {
            audioUrl: result.url,
            audioFile: file.name
          },
          message: 'Audio file uploaded successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to upload audio file'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload audio file'
      };
    }
  }

  // ==================== BULK/UTILITY APIs ====================
  
  /**
   * Get complete category with chapters and audio items
   * GET /api/ai-audio/categories/:categoryId/complete
   */
  async getCategoryWithContent(categoryId: string): Promise<ApiResponse<any>> {
    try {
      // Get category
      const categoryResult = await this.getCategoryById(categoryId);
      if (!categoryResult.success || !categoryResult.data) {
        return categoryResult;
      }
      
      // Get chapters (graceful fallback on error)
      const chaptersResult = await this.getChaptersByCategory(categoryId);
      const chaptersList = chaptersResult.success ? (chaptersResult.data || []) : [];
      
      // Get audio items for each chapter (graceful fallback per chapter)
      const chaptersWithAudio = await Promise.all(
        chaptersList.map(async (chapter) => {
          const audioItemsResult = await this.getAudioItemsByChapter(chapter.id);
          return {
            ...chapter,
            audioItems: audioItemsResult.success ? (audioItemsResult.data || []) : []
          };
        })
      );
      
      return {
        success: true,
        data: {
          ...categoryResult.data,
          chapters: chaptersWithAudio
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch complete category'
      };
    }
  }

  /**
   * Get all categories with their chapters and audio items
   * GET /api/ai-audio/complete
   */
  async getAllCategoriesWithContent(): Promise<ApiResponse<any[]>> {
    try {
      const categoriesResult = await this.getAllCategories();
      if (!categoriesResult.success || !categoriesResult.data) {
        return categoriesResult;
      }
      
      const categoriesWithContent = await Promise.all(
        categoriesResult.data.map(async (category) => {
          const contentResult = await this.getCategoryWithContent(category.id);
          if (contentResult.success && contentResult.data) {
            return contentResult.data;
          }
          // Fallback to at least return the category shell
          return { ...category, chapters: [] };
        })
      );
      
      // Filter out any accidental null/undefined
      const cleaned = categoriesWithContent.filter(Boolean);
      
      return {
        success: true,
        data: cleaned
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch all categories with content'
      };
    }
  }
}

export const aiAudioService = new AIAudioService();
