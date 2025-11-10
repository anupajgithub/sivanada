# Mobile App Integration Guide

This guide explains how to integrate your mobile application (React Native, Flutter, Native iOS/Android) with the CMS Admin backend.

## Table of Contents

1. [Overview](#overview)
2. [Firebase Setup for Mobile](#firebase-setup-for-mobile)
3. [REST API Endpoints](#rest-api-endpoints)
4. [Data Structure](#data-structure)
5. [Authentication Flow](#authentication-flow)
6. [Content Fetching](#content-fetching)
7. [Code Examples](#code-examples)
8. [Offline Support](#offline-support)

---

## Overview

The CMS Admin system uses Firebase as the backend. Your mobile app can:
- **Option 1**: Connect directly to Firebase (recommended for real-time updates)
- **Option 2**: Use REST API wrapper (if you build one)
- **Option 3**: Use Firebase Cloud Functions as API endpoints

This guide covers **Option 1** (Direct Firebase Integration).

---

## Firebase Setup for Mobile

### 1. Add Firebase to Your Mobile App

#### For React Native
```bash
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install @react-native-firebase/storage
```

#### For Flutter
```yaml
# pubspec.yaml
dependencies:
  firebase_core: latest
  firebase_auth: latest
  cloud_firestore: latest
  firebase_storage: latest
```

#### For Native iOS
Use Firebase iOS SDK via CocoaPods

#### For Native Android
Use Firebase Android SDK via Gradle

### 2. Configure Firebase

Download the configuration files from Firebase Console:
- **iOS**: `GoogleService-Info.plist`
- **Android**: `google-services.json`

Use the **same Firebase project** as your CMS Admin web app.

---

## REST API Endpoints

If you prefer REST APIs over direct Firebase, you can create Cloud Functions or use the following structure:

### Base URL
```
https://your-project.firebaseapp.com/api
```

### Authentication
```
POST /auth/login
Body: { email, password }
Response: { success: true, token: "...", user: {...} }
```

### Content Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/books` | Get all books |
| GET | `/books/:id` | Get book by ID |
| GET | `/books/:id/chapters` | Get chapters for a book |
| GET | `/audio/:category` | Get audio by category (bhajan/talks) |
| GET | `/ai-audio/categories` | Get AI audio categories |
| GET | `/ai-audio/categories/:id/complete` | Get category with chapters and items |
| GET | `/wallpapers` | Get all wallpapers |
| GET | `/wallpapers/:category` | Get wallpapers by category |
| GET | `/calendar/events` | Get calendar events |
| GET | `/calendar/events/range?start=...&end=...` | Get events by date range |
| GET | `/slides` | Get all slides |

---

## Data Structure

### Books
```json
{
  "id": "book_123",
  "title": "Bhagavad Gita",
  "titleHi": "श्रीमद्भगवद्गीता",
  "description": "Ancient Hindu scripture",
  "descriptionHi": "प्राचीन हिंदू धर्मग्रंथ",
  "coverImage": "https://storage.googleapis.com/...",
  "status": "Published",
  "createdAt": "2024-01-15T10:00:00Z",
  "chapters": [
    {
      "id": "chapter_456",
      "bookId": "book_123",
      "title": "Chapter 1",
      "titleHi": "अध्याय 1",
      "content": "Content in English...",
      "contentHi": "हिंदी में सामग्री...",
      "audioNarration": "https://storage.googleapis.com/...",
      "order": 1
    }
  ]
}
```

### Audio (Bhajan/Talks)
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

### AI Audio (Complete Structure)
```json
{
  "id": "cat_001",
  "name": "Meditation Music",
  "description": "AI-generated meditation tracks",
  "status": "Published",
  "chapters": [
    {
      "id": "chap_101",
      "categoryId": "cat_001",
      "title": "Morning Meditation",
      "description": "Peaceful morning tracks",
      "order": 1,
      "audioItems": [
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
      ]
    }
  ]
}
```

### Wallpapers
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

### Calendar Events
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

### Slides
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

## Authentication Flow

### User Login (Mobile App)

```typescript
// React Native Example
import auth from '@react-native-firebase/auth';

async function loginUser(email: string, password: string) {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Get user profile from Firestore
    const userDoc = await firestore()
      .collection('users')
      .doc(user.uid)
      .get();
    
    return {
      success: true,
      user: userDoc.data()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

```dart
// Flutter Example
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

Future<Map<String, dynamic>> loginUser(String email, String password) async {
  try {
    final userCredential = await FirebaseAuth.instance
        .signInWithEmailAndPassword(email: email, password: password);
    
    final userDoc = await FirebaseFirestore.instance
        .collection('users')
        .doc(userCredential.user!.uid)
        .get();
    
    return {
      'success': true,
      'user': userDoc.data()
    };
  } catch (e) {
    return {
      'success': false,
      'error': e.toString()
    };
  }
}
```

---

## Content Fetching

### Fetch All Books

```typescript
// React Native
import firestore from '@react-native-firebase/firestore';

async function getAllBooks() {
  try {
    const snapshot = await firestore()
      .collection('books')
      .where('status', '==', 'Published')
      .orderBy('createdAt', 'desc')
      .get();
    
    const books = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: books };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

```dart
// Flutter
import 'package:cloud_firestore/cloud_firestore.dart';

Future<Map<String, dynamic>> getAllBooks() async {
  try {
    final snapshot = await FirebaseFirestore.instance
        .collection('books')
        .where('status', isEqualTo: 'Published')
        .orderBy('createdAt', descending: true)
        .get();
    
    final books = snapshot.docs.map((doc) => {
      'id': doc.id,
      ...doc.data()
    }).toList();
    
    return {'success': true, 'data': books};
  } catch (e) {
    return {'success': false, 'error': e.toString()};
  }
}
```

### Fetch Book with Chapters

```typescript
// React Native
async function getBookWithChapters(bookId: string) {
  try {
    // Get book
    const bookDoc = await firestore()
      .collection('books')
      .doc(bookId)
      .get();
    
    if (!bookDoc.exists) {
      throw new Error('Book not found');
    }
    
    // Get chapters
    const chaptersSnapshot = await firestore()
      .collection('bookChapters')
      .where('bookId', '==', bookId)
      .orderBy('order', 'asc')
      .get();
    
    const chapters = chaptersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      success: true,
      data: {
        ...bookDoc.data(),
        id: bookDoc.id,
        chapters
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Fetch AI Audio Complete Structure

```typescript
// React Native
async function getAIAudioCategories() {
  try {
    // Get all categories
    const categoriesSnapshot = await firestore()
      .collection('aiAudioCategories')
      .where('status', '==', 'Published')
      .get();
    
    const categories = await Promise.all(
      categoriesSnapshot.docs.map(async (catDoc) => {
        const categoryData = { id: catDoc.id, ...catDoc.data() };
        
        // Get chapters for this category
        const chaptersSnapshot = await firestore()
          .collection('aiAudioChapters')
          .where('categoryId', '==', catDoc.id)
          .orderBy('order', 'asc')
          .get();
        
        const chapters = await Promise.all(
          chaptersSnapshot.docs.map(async (chapDoc) => {
            const chapterData = { id: chapDoc.id, ...chapDoc.data() };
            
            // Get audio items for this chapter
            const itemsSnapshot = await firestore()
              .collection('aiAudioItems')
              .where('chapterId', '==', chapDoc.id)
              .where('status', '==', 'Published')
              .orderBy('order', 'asc')
              .get();
            
            const audioItems = itemsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            return {
              ...chapterData,
              audioItems
            };
          })
        );
        
        return {
          ...categoryData,
          chapters
        };
      })
    );
    
    return { success: true, data: categories };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Fetch Audio by Category

```typescript
// React Native
async function getAudioByCategory(category: 'bhajan' | 'talks') {
  try {
    const snapshot = await firestore()
      .collection('audio')
      .where('category', '==', category)
      .where('status', '==', 'Published')
      .orderBy('createdAt', 'desc')
      .get();
    
    const audio = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: audio };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Fetch Wallpapers

```typescript
// React Native
async function getWallpapersByCategory(category: string) {
  try {
    const snapshot = await firestore()
      .collection('wallpapers')
      .where('category', '==', category)
      .where('status', '==', 'Published')
      .orderBy('createdAt', 'desc')
      .get();
    
    const wallpapers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: wallpapers };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Fetch Calendar Events

```typescript
// React Native
async function getEventsByDateRange(startDate: string, endDate: string) {
  try {
    const snapshot = await firestore()
      .collection('calendarEvents')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .where('status', '==', 'Published')
      .orderBy('date', 'asc')
      .get();
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { success: true, data: events };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

---

## Code Examples

### Complete React Native Service

```typescript
// services/FirebaseService.ts
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

class FirebaseService {
  // Authentication
  async login(email: string, password: string) {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      const userDoc = await firestore().collection('users').doc(userCredential.user.uid).get();
      return { success: true, user: userDoc.data() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Books
  async getAllBooks() {
    try {
      const snapshot = await firestore()
        .collection('books')
        .where('status', '==', 'Published')
        .orderBy('createdAt', 'desc')
        .get();
      
      const books = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: books };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getBookWithChapters(bookId: string) {
    try {
      const bookDoc = await firestore().collection('books').doc(bookId).get();
      
      if (!bookDoc.exists) {
        throw new Error('Book not found');
      }
      
      const chaptersSnapshot = await firestore()
        .collection('bookChapters')
        .where('bookId', '==', bookId)
        .orderBy('order', 'asc')
        .get();
      
      const chapters = chaptersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return {
        success: true,
        data: {
          ...bookDoc.data(),
          id: bookDoc.id,
          chapters
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Audio (Bhajan/Talks)
  async getAudioByCategory(category: 'bhajan' | 'talks') {
    try {
      const snapshot = await firestore()
        .collection('audio')
        .where('category', '==', category)
        .where('status', '==', 'Published')
        .orderBy('createdAt', 'desc')
        .get();
      
      const audio = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: audio };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Wallpapers
  async getWallpapersByCategory(category: string) {
    try {
      const snapshot = await firestore()
        .collection('wallpapers')
        .where('category', '==', category)
        .where('status', '==', 'Published')
        .orderBy('createdAt', 'desc')
        .get();
      
      const wallpapers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: wallpapers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Calendar Events
  async getEventsByDateRange(startDate: string, endDate: string) {
    try {
      const snapshot = await firestore()
        .collection('calendarEvents')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .where('status', '==', 'Published')
        .orderBy('date', 'asc')
        .get();
      
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: events };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Slides
  async getAllSlides() {
    try {
      const snapshot = await firestore()
        .collection('slides')
        .where('status', '==', 'Published')
        .orderBy('order', 'asc')
        .get();
      
      const slides = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data: slides };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new FirebaseService();
```

### Usage in React Native Component

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import FirebaseService from './services/FirebaseService';

export default function BooksScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const result = await FirebaseService.getAllBooks();
    
    if (result.success) {
      setBooks(result.data);
    } else {
      console.error('Error loading books:', result.error);
    }
    
    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <FlatList
      data={books}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View>
          <Text>{item.title}</Text>
          <Text>{item.titleHi}</Text>
        </View>
      )}
    />
  );
}
```

---

## Offline Support

### Enable Offline Persistence

```typescript
// React Native - App initialization
import firestore from '@react-native-firebase/firestore';

// Enable offline persistence
firestore().settings({
  persistence: true,
  cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED
});
```

```dart
// Flutter - main.dart
import 'package:cloud_firestore/cloud_firestore.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Enable offline persistence
  FirebaseFirestore.instance.settings = Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );
  
  runApp(MyApp());
}
```

---

## Firestore Collections Reference

| Collection Name | Purpose |
|----------------|---------|
| `users` | User profiles |
| `books` | Books |
| `bookChapters` | Book chapters |
| `audio` | Bhajan and Talks audio |
| `aiAudioCategories` | AI audio categories |
| `aiAudioChapters` | AI audio chapters |
| `aiAudioItems` | AI audio items |
| `wallpapers` | Wallpapers |
| `calendarEvents` | Calendar events |
| `slides` | Slides content |

---

## Security Considerations

1. **Read-only Access**: Mobile apps should typically have read-only access to content
2. **User Data**: Only allow users to modify their own profile
3. **File Access**: Ensure storage security rules allow public read for published content
4. **Authentication**: Always verify user authentication before accessing user-specific data

---

## Testing

### Test with Demo Data

Use the demo credentials provided:
- Email: `user@demo.com`
- Password: `demo123`

### Test Firestore Queries

Use Firebase Console → Firestore to verify data structure and test queries.

---

## Support

For mobile integration issues:
1. Verify Firebase configuration files are correctly added
2. Check Firestore security rules
3. Test queries in Firebase Console first
4. Use Firebase Analytics to track errors

---

**Last Updated:** January 2024  
**Version:** 1.0.0
