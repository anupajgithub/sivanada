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
import { db, auth } from '../lib/firebase';
import { Book, Chapter, ApiResponse, PaginatedResponse, QueryFilters } from '../types';
import { uploadService } from './uploadService';

class BookService {
  private booksCollection = 'books';
  private chaptersCollection = 'chapters';
  private legacyChaptersCollection = 'bookChapters';
  private storageFolder = 'books';

  // Get all books with filters
  async getBooks(filters: QueryFilters = {}): Promise<PaginatedResponse<Book>> {
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

      let q = query(collection(db, this.booksCollection));

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
          collection(db, this.booksCollection),
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
      let books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        books = books.filter(book => 
          book.title.toLowerCase().includes(searchLower) ||
          book.author.toLowerCase().includes(searchLower) ||
          book.description.toLowerCase().includes(searchLower)
        );
      }

      // Get total count for pagination
      const totalQuery = query(collection(db, this.booksCollection));
      const totalSnapshot = await getDocs(totalQuery);
      const total = totalSnapshot.size;

      return {
        success: true,
        data: books,
        total,
        page,
        limit,
        hasMore: books.length === limit
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

  // Get book by ID
  async getBook(id: string): Promise<ApiResponse<Book>> {
    try {
      const docRef = doc(db, this.booksCollection, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const bookData = { id: docSnap.id, ...docSnap.data() } as Book;
        
        // Get chapters for this book (no orderBy to avoid index), fallback to legacy
        let chaptersSnap = await getDocs(query(
          collection(db, this.chaptersCollection),
          where('bookId', '==', id)
        ));
        if (chaptersSnap.empty) {
          chaptersSnap = await getDocs(query(
            collection(db, this.legacyChaptersCollection),
            where('bookId', '==', id)
          ));
        }
        const chapters = (
          chaptersSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[]
        ).sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));

        bookData.chapters = chapters;
        bookData.totalChapters = chapters.length;

        return { success: true, data: bookData };
      } else {
        return {
          success: false,
          error: 'Book not found'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get book'
      };
    }
  }

  // Create new book
  async createBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'chapters' | 'totalChapters' | 'readCount'>): Promise<ApiResponse<Book>> {
    try {
      const now = new Date().toISOString();
      const newBook = {
        ...bookData,
        chapters: [],
        totalChapters: 0,
        readCount: 0,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.booksCollection), newBook);
      
      return {
        success: true,
        data: {
          id: docRef.id,
          ...newBook
        } as Book,
        message: 'Book created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create book'
      };
    }
  }

  // Update book
  async updateBook(id: string, updates: Partial<Book>): Promise<ApiResponse<Book>> {
    try {
      const docRef = doc(db, this.booksCollection, id);
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
          } as Book,
          message: 'Book updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Book not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update book'
      };
    }
  }

  // Delete book
  async deleteBook(id: string): Promise<ApiResponse<null>> {
    try {
      // Delete all chapters first
      const chaptersQuery = query(
        collection(db, this.chaptersCollection),
        where('bookId', '==', id)
      );
      const chaptersSnapshot = await getDocs(chaptersQuery);
      
      const deleteChapterPromises = chaptersSnapshot.docs.map(chapterDoc => 
        deleteDoc(doc(db, this.chaptersCollection, chapterDoc.id))
      );
      await Promise.all(deleteChapterPromises);

      // Delete book document
      const docRef = doc(db, this.booksCollection, id);
      await deleteDoc(docRef);

      return {
        success: true,
        message: 'Book and all chapters deleted successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete book'
      };
    }
  }

  // Upload book cover
  async uploadBookCover(file: File, bookId: string): Promise<ApiResponse<string>> {
    try {
      const result = await uploadService.uploadImage(file, `books/covers/${bookId}`);
      
      if (result.success && result.url) {
        // Update book with new cover URL
        await this.updateBook(bookId, { coverImage: result.url });
        
        return {
          success: true,
          data: result.url,
          message: 'Book cover uploaded successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to upload book cover'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload book cover'
      };
    }
  }

  // Chapter Management Methods

  // Get chapters for a book
  async getChapters(bookId: string): Promise<ApiResponse<Chapter[]>> {
    try {
      // Primary collection: chapters (no orderBy to avoid composite index requirement)
      const q = query(
        collection(db, this.chaptersCollection),
        where('bookId', '==', bookId)
      );
      let querySnapshot = await getDocs(q);

      // If empty, try legacy collection: bookChapters
      if (querySnapshot.empty) {
        const qLegacy = query(
          collection(db, this.legacyChaptersCollection),
          where('bookId', '==', bookId)
        );
        querySnapshot = await getDocs(qLegacy);
      }

      let chapters = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Chapter[];
      // Sort on client to avoid index
      chapters = chapters.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));
      return { success: true, data: chapters };
    } catch (error: any) {
      return { success: false, data: [], error: error.message || 'Failed to get chapters' };
    }
  }

  // Get chapter by ID
  async getChapter(id: string): Promise<ApiResponse<Chapter>> {
    try {
      let snap = await getDoc(doc(db, this.chaptersCollection, id));
      if (!snap.exists()) {
        snap = await getDoc(doc(db, this.legacyChaptersCollection, id));
      }
      if (snap.exists()) {
        return { success: true, data: { id: snap.id, ...snap.data() } as Chapter };
      }
      return { success: false, error: 'Chapter not found' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get chapter' };
    }
  }

  // Create new chapter
  async createChapter(chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Chapter>> {
    try {
      const now = new Date().toISOString();
      const newChapter: any = {
        ...chapterData,
        createdAt: now,
        updatedAt: now,
        createdBy: auth.currentUser?.uid || null,
      };

      // Try primary collection first
      let docRef;
      try {
        docRef = await addDoc(collection(db, this.chaptersCollection), newChapter);
      } catch (e: any) {
        // Fallback to legacy collection if rules/structure expect it
        docRef = await addDoc(collection(db, this.legacyChaptersCollection), newChapter);
      }
      
      // Update book's total chapters count
      const bookRef = doc(db, this.booksCollection, chapterData.bookId);
      await updateDoc(bookRef, { totalChapters: increment(1), updatedAt: now });

      return {
        success: true,
        data: { id: docRef.id, ...newChapter } as Chapter,
        message: 'Chapter created successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create chapter'
      };
    }
  }

  // Update chapter
  async updateChapter(id: string, updates: Partial<Chapter>): Promise<ApiResponse<Chapter>> {
    try {
      const updateData = { ...updates, updatedAt: new Date().toISOString() };

      // Try update in primary collection; if not found, try legacy
      let updatedDoc = await getDoc(doc(db, this.chaptersCollection, id));
      if (updatedDoc.exists()) {
        await updateDoc(doc(db, this.chaptersCollection, id), updateData);
        updatedDoc = await getDoc(doc(db, this.chaptersCollection, id));
      } else {
        await updateDoc(doc(db, this.legacyChaptersCollection, id), updateData);
        updatedDoc = await getDoc(doc(db, this.legacyChaptersCollection, id));
      }

      // Get updated document
      if (updatedDoc.exists()) {
        return {
          success: true,
          data: {
            id: updatedDoc.id,
            ...updatedDoc.data()
          } as Chapter,
          message: 'Chapter updated successfully'
        };
      } else {
        return {
          success: false,
          error: 'Chapter not found after update'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update chapter'
      };
    }
  }

  // Delete chapter
  async deleteChapter(id: string): Promise<ApiResponse<null>> {
    try {
      // Get chapter data to get bookId
      const chapterResponse = await this.getChapter(id);
      if (!chapterResponse.success || !chapterResponse.data) {
        return {
          success: false,
          error: 'Chapter not found'
        };
      }

      const chapter = chapterResponse.data;

      // Delete chapter document (try primary then legacy)
      try {
        await deleteDoc(doc(db, this.chaptersCollection, id));
      } catch {
        await deleteDoc(doc(db, this.legacyChaptersCollection, id));
      }

      // Update book's total chapters count
      const bookRef = doc(db, this.booksCollection, chapter.bookId);
      await updateDoc(bookRef, {
        totalChapters: increment(-1),
        updatedAt: new Date().toISOString()
      });

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

  // Upload chapter audio
  async uploadChapterAudio(file: File, chapterId: string): Promise<ApiResponse<string>> {
    try {
      const result = await uploadService.uploadAudio(file, `books/audio/${chapterId}`);
      
      if (result.success && result.url) {
        // Update chapter with audio URL
        await this.updateChapter(chapterId, { audioUrl: result.url });
        
        return {
          success: true,
          data: result.url,
          message: 'Chapter audio uploaded successfully'
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to upload chapter audio'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload chapter audio'
      };
    }
  }

  // Increment book read count
  async incrementReadCount(id: string): Promise<ApiResponse<null>> {
    try {
      const docRef = doc(db, this.booksCollection, id);
      await updateDoc(docRef, {
        readCount: increment(1),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Read count updated'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update read count'
      };
    }
  }

  // Get featured books
  async getFeaturedBooks(limit: number = 10): Promise<ApiResponse<Book[]>> {
    try {
      const q = query(
        collection(db, this.booksCollection),
        where('featured', '==', true),
        where('status', '==', 'published'),
        orderBy('readCount', 'desc'),
        fbLimit(limit)
      );

      const querySnapshot = await getDocs(q);
      const books = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];

      return {
        success: true,
        data: books
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || 'Failed to get featured books'
      };
    }
  }

  // Get books statistics
  async getBooksStats(): Promise<ApiResponse<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalChapters: number;
    totalReads: number;
  }>> {
    try {
      const querySnapshot = await getDocs(collection(db, this.booksCollection));
      const books = querySnapshot.docs.map(doc => doc.data()) as Book[];

      const chaptersSnapshot = await getDocs(collection(db, this.chaptersCollection));

      const stats = {
        total: books.length,
        published: books.filter(b => b.status === 'published').length,
        draft: books.filter(b => b.status === 'draft').length,
        archived: books.filter(b => b.status === 'archived').length,
        totalChapters: chaptersSnapshot.size,
        totalReads: books.reduce((sum, book) => sum + (book.readCount || 0), 0)
      };

      return {
        success: true,
        data: stats
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get books statistics'
      };
    }
  }

  // Real-time: subscribe to books list
  subscribeToBooks(filters: QueryFilters = {}, callback: (books: Book[]) => void) {
    const {
      search,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 50
    } = filters;

    let q = query(collection(db, this.booksCollection));
    if (status && status !== 'all') q = query(q, where('status', '==', status));
    if (category && category !== 'all') q = query(q, where('category', '==', category));
    q = query(q, orderBy(sortBy, sortOrder), fbLimit(limit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let books = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Book[];
      if (search) {
        const s = search.toLowerCase();
        books = books.filter(b =>
          b.title.toLowerCase().includes(s) ||
          b.author.toLowerCase().includes(s) ||
          b.description.toLowerCase().includes(s)
        );
      }
      callback(books);
    });

    return unsubscribe;
  }

  // Real-time: subscribe to single book and its chapters
  subscribeToBookWithChapters(id: string, callback: (payload: { book: Book | null; chapters: Chapter[] }) => void) {
    const bookRef = doc(db, this.booksCollection, id);
    const chaptersQuery = query(
      collection(db, this.chaptersCollection),
      where('bookId', '==', id),
      orderBy('chapterNumber', 'asc')
    );

    const unsubBook = onSnapshot(bookRef, (snap) => {
      const book = snap.exists() ? ({ id: snap.id, ...snap.data() } as Book) : null;
      // We emit combined payload when chapters change as well; here emit interim if needed
      callback({ book, chapters: [] });
    });

    const unsubChapters = onSnapshot(chaptersQuery, (snapshot) => {
      const chapters = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Chapter[];
      callback({ book: null, chapters });
    });

    return () => {
      unsubBook();
      unsubChapters();
    };
  }
}

export const bookService = new BookService();