# Mobile App API Endpoints Reference

Quick reference for mobile app developers. This guide shows the exact Firestore queries needed for each content type.

## 🚀 Quick Start

### Firebase Setup
```typescript
// React Native
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Flutter
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
```

---

## 📚 Content Endpoints

### 1. Authentication

#### Login User
```typescript
// React Native
import auth from '@react-native-firebase/auth';

const login = async (email, password) => {
  const userCred = await auth().signInWithEmailAndPassword(email, password);
  const userDoc = await firestore()
    .collection('users')
    .doc(userCred.user.uid)
    .get();
  
  return userDoc.data();
};
```

```dart
// Flutter
Future<Map<String, dynamic>> login(String email, String password) async {
  final userCred = await FirebaseAuth.instance
      .signInWithEmailAndPassword(email: email, password: password);
  
  final userDoc = await FirebaseFirestore.instance
      .collection('users')
      .doc(userCred.user!.uid)
      .get();
  
  return userDoc.data()!;
}
```

---

### 2. Books

#### Get All Published Books
```typescript
// Collection: books
// Query
const books = await firestore()
  .collection('books')
  .where('status', '==', 'Published')
  .orderBy('createdAt', 'desc')
  .get();

const booksList = books.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**Response Structure:**
```json
{
  "id": "book_123",
  "title": "Bhagavad Gita",
  "titleHi": "श्रीमद्भगवद्गीता",
  "description": "Ancient Hindu scripture",
  "descriptionHi": "प्राचीन हिंदू धर्मग्रंथ",
  "coverImage": "https://storage.googleapis.com/...",
  "status": "Published",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Get Chapters for a Book
```typescript
// Collection: bookChapters
// Query
const chapters = await firestore()
  .collection('bookChapters')
  .where('bookId', '==', bookId)
  .orderBy('order', 'asc')
  .get();

const chaptersList = chapters.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));
```

**Response Structure:**
```json
{
  "id": "chapter_456",
  "bookId": "book_123",
  "title": "Chapter 1: Introduction",
  "titleHi": "अध्याय 1: परिचय",
  "content": "Chapter content in English...",
  "contentHi": "हिंदी में सामग्री...",
  "audioNarration": "https://storage.googleapis.com/...",
  "order": 1
}
```

---

### 3. Audio (Bhajan & Talks)

#### Get All Bhajans
```typescript
// Collection: audio
// Query
const bhajans = await firestore()
  .collection('audio')
  .where('category', '==', 'bhajan')
  .where('status', '==', 'Published')
  .orderBy('createdAt', 'desc')
  .get();
```

#### Get All Talks
```typescript
// Collection: audio
// Query
const talks = await firestore()
  .collection('audio')
  .where('category', '==', 'talks')
  .where('status', '==', 'Published')
  .orderBy('createdAt', 'desc')
  .get();
```

**Response Structure:**
```json
{
  "id": "audio_789",
  "title": "Hanuman Chalisa",
  "description": "Sacred devotional hymn",
  "category": "bhajan",
  "text": "श्रीगुरु चरन सरोज रज...",
  "audioFile": "hanuman_chalisa.mp3",
  "audioUrl": "https://storage.googleapis.com/...",
  "duration": "8:45",
  "status": "Published",
  "views": 15420,
  "likes": 890
}
```

---

### 4. AI Audio (Hierarchical Structure)

#### Get All AI Audio Categories
```typescript
// Collection: aiAudioCategories
// Query
const categories = await firestore()
  .collection('aiAudioCategories')
  .where('status', '==', 'Published')
  .orderBy('createdAt', 'desc')
  .get();
```

**Response Structure:**
```json
{
  "id": "cat_001",
  "name": "Meditation Music",
  "description": "AI-generated meditation tracks",
  "status": "Published",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### Get Chapters for a Category
```typescript
// Collection: aiAudioChapters
// Query
const chapters = await firestore()
  .collection('aiAudioChapters')
  .where('categoryId', '==', categoryId)
  .orderBy('order', 'asc')
  .get();
```

**Response Structure:**
```json
{
  "id": "chap_101",
  "categoryId": "cat_001",
  "title": "Morning Meditation",
  "description": "Peaceful morning tracks",
  "order": 1
}
```

#### Get Audio Items for a Chapter
```typescript
// Collection: aiAudioItems
// Query
const audioItems = await firestore()
  .collection('aiAudioItems')
  .where('chapterId', '==', chapterId)
  .where('status', '==', 'Published')
  .orderBy('order', 'asc')
  .get();
```

**Response Structure:**
```json
{
  "id": "item_1001",
  "chapterId": "chap_101",
  "categoryId": "cat_001",
  "title": "Sunrise Meditation",
  "text": "Close your eyes and breathe deeply...",
  "audioUrl": "https://storage.googleapis.com/...",
  "duration": "10:30",
  "status": "Published",
  "order": 1
}
```

#### Get Complete AI Audio Structure (All at Once)
```typescript
// Fetch everything in nested structure
async function getCompleteAIAudio() {
  // Get categories
  const categoriesSnap = await firestore()
    .collection('aiAudioCategories')
    .where('status', '==', 'Published')
    .get();
  
  const categories = await Promise.all(
    categoriesSnap.docs.map(async (catDoc) => {
      // Get chapters for this category
      const chaptersSnap = await firestore()
        .collection('aiAudioChapters')
        .where('categoryId', '==', catDoc.id)
        .orderBy('order', 'asc')
        .get();
      
      const chapters = await Promise.all(
        chaptersSnap.docs.map(async (chapDoc) => {
          // Get audio items for this chapter
          const itemsSnap = await firestore()
            .collection('aiAudioItems')
            .where('chapterId', '==', chapDoc.id)
            .where('status', '==', 'Published')
            .orderBy('order', 'asc')
            .get();
          
          return {
            id: chapDoc.id,
            ...chapDoc.data(),
            audioItems: itemsSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          };
        })
      );
      
      return {
        id: catDoc.id,
        ...catDoc.data(),
        chapters
      };
    })
  );
  
  return categories;
}
```

---

### 5. Wallpapers

#### Get All Wallpapers
```typescript
// Collection: wallpapers
// Query
const wallpapers = await firestore()
  .collection('wallpapers')
  .where('status', '==', 'Published')
  .orderBy('createdAt', 'desc')
  .get();
```

#### Get Wallpapers by Category
```typescript
// Collection: wallpapers
// Categories: 'deities', 'nature', 'festivals', 'abstract'
const wallpapers = await firestore()
  .collection('wallpapers')
  .where('category', '==', 'deities')
  .where('status', '==', 'Published')
  .get();
```

#### Get Featured Wallpapers
```typescript
// Collection: wallpapers
// Query
const featured = await firestore()
  .collection('wallpapers')
  .where('isFeatured', '==', true)
  .where('status', '==', 'Published')
  .limit(10)
  .get();
```

**Response Structure:**
```json
{
  "id": "wall_001",
  "title": "Ganesh Ji",
  "category": "deities",
  "imageUrl": "https://storage.googleapis.com/...",
  "thumbnailUrl": "https://storage.googleapis.com/...",
  "isFeatured": true,
  "downloads": 1520,
  "status": "Published"
}
```

---

### 6. Calendar Events

#### Get All Events
```typescript
// Collection: calendarEvents
// Query
const events = await firestore()
  .collection('calendarEvents')
  .where('status', '==', 'Published')
  .orderBy('date', 'asc')
  .get();
```

#### Get Events by Date Range
```typescript
// Collection: calendarEvents
// Query
const events = await firestore()
  .collection('calendarEvents')
  .where('date', '>=', '2024-01-01')
  .where('date', '<=', '2024-12-31')
  .where('status', '==', 'Published')
  .orderBy('date', 'asc')
  .get();
```

#### Get Upcoming Events
```typescript
// Collection: calendarEvents
// Query
const today = new Date().toISOString().split('T')[0];
const upcoming = await firestore()
  .collection('calendarEvents')
  .where('date', '>=', today)
  .where('status', '==', 'Published')
  .orderBy('date', 'asc')
  .limit(10)
  .get();
```

**Response Structure:**
```json
{
  "id": "event_001",
  "title": "Diwali",
  "titleHi": "दिवाली",
  "description": "Festival of Lights",
  "descriptionHi": "रोशनी का त्योहार",
  "date": "2024-11-12",
  "time": "18:00",
  "category": "festival",
  "status": "Published"
}
```

---

### 7. Slides

#### Get All Slides
```typescript
// Collection: slides
// Query
const slides = await firestore()
  .collection('slides')
  .where('status', '==', 'Published')
  .orderBy('order', 'asc')
  .get();
```

**Response Structure:**
```json
{
  "id": "slide_001",
  "title": "Welcome Slide",
  "titleHi": "स्वागत स्लाइड",
  "description": "Welcome message",
  "descriptionHi": "स्वागत संदेश",
  "imageUrl": "https://storage.googleapis.com/...",
  "order": 1,
  "status": "Published"
}
```

---

## 🔄 Common Patterns

### Pattern 1: Pagination
```typescript
// First page
let query = firestore()
  .collection('books')
  .where('status', '==', 'Published')
  .orderBy('createdAt', 'desc')
  .limit(10);

const firstPage = await query.get();
const lastVisible = firstPage.docs[firstPage.docs.length - 1];

// Next page
const nextPage = await query
  .startAfter(lastVisible)
  .get();
```

### Pattern 2: Real-time Updates
```typescript
// Listen for changes
const unsubscribe = firestore()
  .collection('slides')
  .where('status', '==', 'Published')
  .onSnapshot(snapshot => {
    const slides = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Update UI with new data
  });

// Clean up
unsubscribe();
```

### Pattern 3: Batch Fetch
```typescript
// Get multiple related items
async function getBookWithDetails(bookId) {
  const [bookDoc, chaptersSnap] = await Promise.all([
    firestore().collection('books').doc(bookId).get(),
    firestore()
      .collection('bookChapters')
      .where('bookId', '==', bookId)
      .orderBy('order', 'asc')
      .get()
  ]);
  
  return {
    ...bookDoc.data(),
    id: bookDoc.id,
    chapters: chaptersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  };
}
```

---

## 📊 Collection Names Reference

```typescript
const COLLECTIONS = {
  // User & Auth
  users: 'users',
  
  // Books
  books: 'books',
  bookChapters: 'bookChapters',
  
  // Audio
  audio: 'audio',  // Bhajan & Talks
  
  // AI Audio (Hierarchical)
  aiAudioCategories: 'aiAudioCategories',
  aiAudioChapters: 'aiAudioChapters',
  aiAudioItems: 'aiAudioItems',
  
  // Media
  wallpapers: 'wallpapers',
  slides: 'slides',
  
  // Events
  calendarEvents: 'calendarEvents'
};
```

---

## 🎯 Field Names Reference

### Common Fields (All Collections)
- `id` - Document ID
- `status` - "Published" | "Draft"
- `createdAt` - ISO timestamp
- `updatedAt` - ISO timestamp

### Bilingual Fields
- `title` + `titleHi`
- `description` + `descriptionHi`
- `content` + `contentHi`

### Media Fields
- `imageUrl` - Full image URL
- `thumbnailUrl` - Thumbnail URL
- `audioUrl` - Audio file URL
- `coverImage` - Cover/featured image

### Relationship Fields
- `bookId` - References books collection
- `categoryId` - References category
- `chapterId` - References chapter

### Metadata Fields
- `order` - Sort order (number)
- `views` - View count
- `likes` - Like count
- `downloads` - Download count
- `duration` - Audio duration (e.g., "8:45")

---

## ⚡ Performance Tips

### 1. Use Indexes
Create composite indexes for common queries:
```
Collection: books
Index: status ASC, createdAt DESC

Collection: audio
Index: category ASC, status ASC, createdAt DESC

Collection: aiAudioChapters
Index: categoryId ASC, order ASC

Collection: aiAudioItems
Index: chapterId ASC, status ASC, order ASC
```

### 2. Enable Offline Persistence
```typescript
// React Native
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
});

// Flutter
FirebaseFirestore.instance.settings = Settings(
  persistenceEnabled: true,
  cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED
);
```

### 3. Limit Initial Load
```typescript
// Load first 20 items, then load more on demand
const initial = await firestore()
  .collection('books')
  .where('status', '==', 'Published')
  .limit(20)
  .get();
```

### 4. Cache Strategic Data
Cache categories, slides, and other rarely-changing data:
```typescript
// Fetch once and cache
const categories = await fetchCategories();
await AsyncStorage.setItem('categories', JSON.stringify(categories));

// Use cached version
const cached = await AsyncStorage.getItem('categories');
if (cached) return JSON.parse(cached);
```

---

## 🔐 Security Notes

### Read-Only Access
Mobile apps should have **read-only** access to content:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read for published content
    match /{document=**} {
      allow read: if resource.data.status == "Published";
      allow write: if false;  // No write from mobile
    }
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 📱 Example Mobile App Structure

```typescript
// services/FirebaseService.ts

class ContentService {
  // Books
  async getBooks() {
    const snapshot = await firestore()
      .collection('books')
      .where('status', '==', 'Published')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getBookChapters(bookId: string) {
    const snapshot = await firestore()
      .collection('bookChapters')
      .where('bookId', '==', bookId)
      .orderBy('order', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Audio
  async getBhajans() {
    return this.getAudioByCategory('bhajan');
  }

  async getTalks() {
    return this.getAudioByCategory('talks');
  }

  private async getAudioByCategory(category: string) {
    const snapshot = await firestore()
      .collection('audio')
      .where('category', '==', category)
      .where('status', '==', 'Published')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // AI Audio
  async getAIAudioCategories() {
    const snapshot = await firestore()
      .collection('aiAudioCategories')
      .where('status', '==', 'Published')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getAIAudioComplete(categoryId: string) {
    // Implementation from earlier example
  }

  // Wallpapers
  async getWallpapers(category?: string) {
    let query = firestore()
      .collection('wallpapers')
      .where('status', '==', 'Published');
    
    if (category) {
      query = query.where('category', '==', category);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Events
  async getUpcomingEvents() {
    const today = new Date().toISOString().split('T')[0];
    const snapshot = await firestore()
      .collection('calendarEvents')
      .where('date', '>=', today)
      .where('status', '==', 'Published')
      .orderBy('date', 'asc')
      .limit(10)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Slides
  async getSlides() {
    const snapshot = await firestore()
      .collection('slides')
      .where('status', '==', 'Published')
      .orderBy('order', 'asc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}

export default new ContentService();
```

---

**Quick Reference Complete!**  
For detailed examples, see [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)
