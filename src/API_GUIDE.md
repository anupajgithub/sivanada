# CMS Admin - Complete API Guide

This guide provides comprehensive documentation for all API endpoints available in the CMS Admin system. All APIs are designed to work with Firebase Firestore and Firebase Storage.

## Table of Contents

1. [Authentication APIs](#authentication-apis)
2. [User Management APIs](#user-management-apis)
3. [Books Management APIs](#books-management-apis)
4. [Audio Management APIs](#audio-management-apis)
5. [AI Audio Management APIs](#ai-audio-management-apis)
6. [Wallpapers Management APIs](#wallpapers-management-apis)
7. [Calendar Management APIs](#calendar-management-apis)
8. [Slide Management APIs](#slide-management-apis)
9. [Dashboard APIs](#dashboard-apis)
10. [Mobile App Integration](#mobile-app-integration)

---

## Authentication APIs

### Sign In
**Service:** `authService.signIn(email, password)`

```typescript
// Demo credentials (work without Firebase)
const demoAccounts = [
  { email: 'admin@demo.com', password: 'demo123' },
  { email: 'user@demo.com', password: 'demo123' }
];

// Usage
const result = await authService.signIn('admin@demo.com', 'demo123');
if (result.success) {
  console.log('User:', result.data);
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "Admin User",
    "email": "admin@demo.com",
    "role": "admin",
    "status": "active",
    "imageUrl": "https://...",
    "createdAt": "2024-01-15T10:00:00Z",
    "lastLogin": "2024-01-20T15:30:00Z"
  }
}
```

### Sign Out
**Service:** `authService.signOut()`

```typescript
const result = await authService.signOut();
```

### Get Current User
**Service:** `authService.getCurrentUser()`

```typescript
const user = await authService.getCurrentUser();
```

---

## User Management APIs

### Get All Users
**Service:** `userService.getAllUsers()`

```typescript
const result = await userService.getAllUsers();
// Returns list of all users
```

### Get User by ID
**Service:** `userService.getUserById(userId)`

```typescript
const result = await userService.getUserById('user_123');
```

### Create User
**Service:** `userService.createUser(userData)`

```typescript
const result = await userService.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user', // 'admin', 'user', 'premium'
  status: 'active',
  imageUrl: 'https://...' // optional
});
```

### Update User
**Service:** `userService.updateUser(userId, updates)`

```typescript
const result = await userService.updateUser('user_123', {
  name: 'Jane Doe',
  imageUrl: 'https://new-image.jpg'
});
```

### Delete User
**Service:** `userService.deleteUser(userId)`

```typescript
const result = await userService.deleteUser('user_123');
```

### Upload User Profile Image
**Service:** `userService.uploadProfileImage(userId, file)`

```typescript
const file = document.querySelector('input[type="file"]').files[0];
const result = await userService.uploadProfileImage('user_123', file);
// Returns: { imageUrl: 'https://...', imageName: 'filename.jpg' }
```

---

## Books Management APIs

### Get All Books
**Service:** `bookService.getAllBooks()`

```typescript
const result = await bookService.getAllBooks();
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "book_123",
      "title": "Bhagavad Gita",
      "titleHi": "श्रीमद्भगवद्गीता",
      "description": "Ancient Hindu scripture",
      "descriptionHi": "प्राचीन हिंदू धर्मग्रंथ",
      "coverImage": "https://...",
      "status": "Published",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Book by ID
**Service:** `bookService.getBookById(bookId)`

```typescript
const result = await bookService.getBookById('book_123');
```

### Create Book
**Service:** `bookService.createBook(bookData)`

```typescript
const result = await bookService.createBook({
  title: 'Ramayana',
  titleHi: 'रामायण',
  description: 'Epic tale of Lord Rama',
  descriptionHi: 'भगवान राम की महाकाव्य कहानी',
  coverImage: 'https://...',
  status: 'Published' // or 'Draft'
});
```

### Update Book
**Service:** `bookService.updateBook(bookId, updates)`

```typescript
const result = await bookService.updateBook('book_123', {
  title: 'Updated Title',
  status: 'Published'
});
```

### Delete Book
**Service:** `bookService.deleteBook(bookId)`

```typescript
const result = await bookService.deleteBook('book_123');
// Note: This also deletes all chapters associated with the book
```

### Upload Book Cover
**Service:** `bookService.uploadCoverImage(bookId, file)`

```typescript
const file = document.querySelector('input[type="file"]').files[0];
const result = await bookService.uploadCoverImage('book_123', file);
```

---

## Book Chapters APIs

### Get Chapters by Book
**Service:** `bookService.getChaptersByBook(bookId)`

```typescript
const result = await bookService.getChaptersByBook('book_123');
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chapter_456",
      "bookId": "book_123",
      "title": "Chapter 1: Introduction",
      "titleHi": "अध्याय 1: परिचय",
      "content": "Chapter content in English...",
      "contentHi": "अध्याय सामग्री हिंदी में...",
      "audioNarration": "https://...",
      "order": 1,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Chapter
**Service:** `bookService.createChapter(chapterData)`

```typescript
const result = await bookService.createChapter({
  bookId: 'book_123',
  title: 'Chapter 2',
  titleHi: 'अध्याय 2',
  content: 'Content in English',
  contentHi: 'हिंदी में सामग्री',
  audioNarration: 'https://...',
  order: 2
});
```

### Update Chapter
**Service:** `bookService.updateChapter(chapterId, updates)`

```typescript
const result = await bookService.updateChapter('chapter_456', {
  content: 'Updated content',
  audioNarration: 'https://new-audio.mp3'
});
```

### Delete Chapter
**Service:** `bookService.deleteChapter(chapterId)`

```typescript
const result = await bookService.deleteChapter('chapter_456');
```

### Upload Chapter Audio
**Service:** `bookService.uploadChapterAudio(chapterId, file)`

```typescript
const audioFile = document.querySelector('input[type="file"]').files[0];
const result = await bookService.uploadChapterAudio('chapter_456', audioFile);
```

---

## Audio Management APIs

### Get All Audio (Bhajan & Talks)
**Service:** `audioService.getAllAudio()`

```typescript
const result = await audioService.getAllAudio();
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "audio_789",
      "title": "Hanuman Chalisa",
      "description": "Sacred devotional hymn",
      "category": "bhajan", // or "talks"
      "text": "श्रीगुरु चरन सरोज रज...",
      "audioFile": "hanuman_chalisa.mp3",
      "audioUrl": "https://...",
      "duration": "8:45",
      "status": "Published",
      "views": 15420,
      "likes": 890,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Audio by Category
**Service:** `audioService.getAudioByCategory(category)`

```typescript
const result = await audioService.getAudioByCategory('bhajan');
// or
const result = await audioService.getAudioByCategory('talks');
```

### Create Audio
**Service:** `audioService.createAudio(audioData)`

```typescript
const result = await audioService.createAudio({
  title: 'Om Namah Shivaya',
  description: 'Powerful mantra for Lord Shiva',
  category: 'bhajan', // or 'talks'
  text: 'ॐ नमः शिवाय...',
  status: 'Published'
});
```

### Update Audio
**Service:** `audioService.updateAudio(audioId, updates)`

```typescript
const result = await audioService.updateAudio('audio_789', {
  title: 'Updated Title',
  status: 'Published'
});
```

### Delete Audio
**Service:** `audioService.deleteAudio(audioId)`

```typescript
const result = await audioService.deleteAudio('audio_789');
```

### Upload Audio File
**Service:** `audioService.uploadAudioFile(audioId, file)`

```typescript
const audioFile = document.querySelector('input[type="file"]').files[0];
const result = await audioService.uploadAudioFile('audio_789', audioFile);
// Returns: { audioUrl: 'https://...', audioFile: 'filename.mp3', duration: '8:45' }
```

---

## AI Audio Management APIs

The AI Audio system has a hierarchical structure: **Categories → Chapters → Audio Items**

### Category APIs

#### Get All Categories
**Service:** `aiAudioService.getAllCategories()`

```typescript
const result = await aiAudioService.getAllCategories();
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cat_001",
      "name": "Meditation Music",
      "description": "AI-generated meditation tracks",
      "status": "Published",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Get Category by ID
**Service:** `aiAudioService.getCategoryById(categoryId)`

```typescript
const result = await aiAudioService.getCategoryById('cat_001');
```

#### Create Category
**Service:** `aiAudioService.createCategory(categoryData)`

```typescript
const result = await aiAudioService.createCategory({
  name: 'Motivational Speeches',
  description: 'AI-generated motivational content',
  status: 'Published'
});
```

#### Update Category
**Service:** `aiAudioService.updateCategory(categoryId, updates)`

```typescript
const result = await aiAudioService.updateCategory('cat_001', {
  name: 'Updated Name',
  description: 'Updated description'
});
```

#### Delete Category
**Service:** `aiAudioService.deleteCategory(categoryId)`

```typescript
const result = await aiAudioService.deleteCategory('cat_001');
// Note: This also deletes all chapters and audio items in the category
```

### Chapter APIs

#### Get Chapters by Category
**Service:** `aiAudioService.getChaptersByCategory(categoryId)`

```typescript
const result = await aiAudioService.getChaptersByCategory('cat_001');
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chap_101",
      "categoryId": "cat_001",
      "title": "Morning Meditation",
      "description": "Peaceful morning tracks",
      "order": 1,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Chapter
**Service:** `aiAudioService.createChapter(chapterData)`

```typescript
const result = await aiAudioService.createChapter({
  categoryId: 'cat_001',
  title: 'Evening Relaxation',
  description: 'Calming evening meditation',
  order: 2
});
```

#### Update Chapter
**Service:** `aiAudioService.updateChapter(chapterId, updates)`

```typescript
const result = await aiAudioService.updateChapter('chap_101', {
  title: 'Updated Title',
  order: 1
});
```

#### Delete Chapter
**Service:** `aiAudioService.deleteChapter(chapterId)`

```typescript
const result = await aiAudioService.deleteChapter('chap_101');
// Note: This also deletes all audio items in the chapter
```

### Audio Item APIs

#### Get Audio Items by Chapter
**Service:** `aiAudioService.getAudioItemsByChapter(chapterId)`

```typescript
const result = await aiAudioService.getAudioItemsByChapter('chap_101');
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "item_1001",
      "chapterId": "chap_101",
      "categoryId": "cat_001",
      "title": "Sunrise Meditation",
      "text": "Close your eyes and breathe deeply...",
      "audioFile": "sunrise_meditation.mp3",
      "audioUrl": "https://...",
      "duration": "10:30",
      "status": "Published",
      "order": 1,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Audio Item
**Service:** `aiAudioService.createAudioItem(itemData)`

```typescript
const result = await aiAudioService.createAudioItem({
  chapterId: 'chap_101',
  categoryId: 'cat_001',
  title: 'Energy Awakening',
  text: 'As the new day begins...',
  status: 'Published',
  order: 2
});
```

#### Update Audio Item
**Service:** `aiAudioService.updateAudioItem(itemId, updates)`

```typescript
const result = await aiAudioService.updateAudioItem('item_1001', {
  title: 'Updated Title',
  text: 'Updated text content'
});
```

#### Delete Audio Item
**Service:** `aiAudioService.deleteAudioItem(itemId)`

```typescript
const result = await aiAudioService.deleteAudioItem('item_1001');
```

#### Upload Audio File for Item
**Service:** `aiAudioService.uploadAudioFile(itemId, file)`

```typescript
const audioFile = document.querySelector('input[type="file"]').files[0];
const result = await aiAudioService.uploadAudioFile('item_1001', audioFile);
// Returns: { audioUrl: 'https://...', audioFile: 'filename.mp3' }
```

### Utility APIs

#### Get Complete Category (with chapters and audio items)
**Service:** `aiAudioService.getCategoryWithContent(categoryId)`

```typescript
const result = await aiAudioService.getCategoryWithContent('cat_001');
// Returns complete nested structure: category → chapters → audioItems
```

#### Get All Categories with Complete Content
**Service:** `aiAudioService.getAllCategoriesWithContent()`

```typescript
const result = await aiAudioService.getAllCategoriesWithContent();
// Returns all categories with their complete nested structure
```

---

## Wallpapers Management APIs

### Get All Wallpapers
**Service:** `wallpaperService.getAllWallpapers()`

```typescript
const result = await wallpaperService.getAllWallpapers();
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "wall_001",
      "title": "Ganesh Ji",
      "category": "deities",
      "imageUrl": "https://...",
      "thumbnailUrl": "https://...",
      "isFeatured": true,
      "downloads": 1520,
      "status": "Published",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Wallpapers by Category
**Service:** `wallpaperService.getWallpapersByCategory(category)`

```typescript
const result = await wallpaperService.getWallpapersByCategory('deities');
// Categories: 'deities', 'nature', 'festivals', 'abstract'
```

### Create Wallpaper
**Service:** `wallpaperService.createWallpaper(wallpaperData)`

```typescript
const result = await wallpaperService.createWallpaper({
  title: 'Lord Krishna',
  category: 'deities',
  imageUrl: 'https://...',
  isFeatured: false,
  status: 'Published'
});
```

### Update Wallpaper
**Service:** `wallpaperService.updateWallpaper(wallpaperId, updates)`

```typescript
const result = await wallpaperService.updateWallpaper('wall_001', {
  isFeatured: true,
  category: 'festivals'
});
```

### Delete Wallpaper
**Service:** `wallpaperService.deleteWallpaper(wallpaperId)`

```typescript
const result = await wallpaperService.deleteWallpaper('wall_001');
```

### Upload Wallpaper Image
**Service:** `wallpaperService.uploadWallpaperImage(wallpaperId, file)`

```typescript
const imageFile = document.querySelector('input[type="file"]').files[0];
const result = await wallpaperService.uploadWallpaperImage('wall_001', imageFile);
// Returns: { imageUrl: 'https://...', thumbnailUrl: 'https://...' }
```

---

## Calendar Management APIs

### Get All Events
**Service:** `calendarService.getAllEvents()`

```typescript
const result = await calendarService.getAllEvents();
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "event_001",
      "title": "Diwali",
      "titleHi": "दिवाली",
      "description": "Festival of Lights",
      "descriptionHi": "रोशनी का त्योहार",
      "date": "2024-11-12",
      "time": "18:00",
      "category": "festival",
      "status": "Published",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Get Events by Date Range
**Service:** `calendarService.getEventsByDateRange(startDate, endDate)`

```typescript
const result = await calendarService.getEventsByDateRange(
  '2024-01-01',
  '2024-12-31'
);
```

### Create Event
**Service:** `calendarService.createEvent(eventData)`

```typescript
const result = await calendarService.createEvent({
  title: 'Holi',
  titleHi: 'होली',
  description: 'Festival of Colors',
  descriptionHi: 'रंगों का त्योहार',
  date: '2024-03-25',
  time: '10:00',
  category: 'festival',
  status: 'Published'
});
```

### Update Event
**Service:** `calendarService.updateEvent(eventId, updates)`

```typescript
const result = await calendarService.updateEvent('event_001', {
  time: '19:00',
  description: 'Updated description'
});
```

### Delete Event
**Service:** `calendarService.deleteEvent(eventId)`

```typescript
const result = await calendarService.deleteEvent('event_001');
```

---

## Slide Management APIs

### Get All Slides
**Service:** `slideService.getAllSlides()`

```typescript
const result = await slideService.getAllSlides();
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "slide_001",
      "title": "Welcome Slide",
      "titleHi": "स्वागत स्लाइड",
      "description": "Welcome message",
      "descriptionHi": "स्वागत संदेश",
      "imageUrl": "https://...",
      "order": 1,
      "status": "Published",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Create Slide
**Service:** `slideService.createSlide(slideData)`

```typescript
const result = await slideService.createSlide({
  title: 'New Feature',
  titleHi: 'नई सुविधा',
  description: 'Check out our new feature',
  descriptionHi: 'हमारी नई सुविधा देखें',
  imageUrl: 'https://...',
  order: 2,
  status: 'Published'
});
```

### Update Slide
**Service:** `slideService.updateSlide(slideId, updates)`

```typescript
const result = await slideService.updateSlide('slide_001', {
  title: 'Updated Title',
  order: 1
});
```

### Delete Slide
**Service:** `slideService.deleteSlide(slideId)`

```typescript
const result = await slideService.deleteSlide('slide_001');
```

### Upload Slide Image
**Service:** `slideService.uploadSlideImage(slideId, file)`

```typescript
const imageFile = document.querySelector('input[type="file"]').files[0];
const result = await slideService.uploadSlideImage('slide_001', imageFile);
```

---

## Dashboard APIs

### Get Dashboard Statistics
**Service:** `dashboardService.getStats()`

```typescript
const result = await dashboardService.getStats();
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "activeUsers": 980,
    "totalBooks": 45,
    "totalAudio": 120,
    "totalWallpapers": 350,
    "totalEvents": 28,
    "totalSlides": 8
  }
}
```

### Get Recent Activity
**Service:** `dashboardService.getRecentActivity(limit)`

```typescript
const result = await dashboardService.getRecentActivity(10);
// Returns last 10 activities
```

---

## Mobile App Integration

### Complete Data Structure for Mobile App

When fetching data for a mobile app, use these endpoints to get complete nested structures:

#### Get All Books with Chapters
```typescript
const books = await bookService.getAllBooks();
for (const book of books.data) {
  const chapters = await bookService.getChaptersByBook(book.id);
  book.chapters = chapters.data;
}
```

#### Get All AI Audio with Complete Structure
```typescript
const result = await aiAudioService.getAllCategoriesWithContent();
// Returns: categories → chapters → audioItems (fully nested)
```

#### Get All Calendar Events for a Year
```typescript
const result = await calendarService.getEventsByDateRange(
  '2024-01-01',
  '2024-12-31'
);
```

### Mobile App Endpoints Summary

| Content Type | Endpoint | Returns |
|-------------|----------|---------|
| Books | `bookService.getAllBooks()` | All books |
| Chapters | `bookService.getChaptersByBook(bookId)` | Book chapters |
| Audio (Bhajan/Talks) | `audioService.getAudioByCategory(category)` | Audio by category |
| AI Audio | `aiAudioService.getAllCategoriesWithContent()` | Complete nested structure |
| Wallpapers | `wallpaperService.getWallpapersByCategory(category)` | Wallpapers by category |
| Events | `calendarService.getEventsByDateRange(start, end)` | Events in date range |
| Slides | `slideService.getAllSlides()` | All slides |

---

## Error Handling

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Example Error Handling
```typescript
const result = await bookService.getBookById('invalid_id');
if (!result.success) {
  console.error('Error:', result.error);
  // Handle error (show toast, alert, etc.)
} else {
  console.log('Book:', result.data);
  // Use the data
}
```

---

## Firebase Setup Requirements

Before using these APIs, ensure Firebase is properly configured:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication, Firestore, and Storage
3. Update `/lib/firebase.ts` with your Firebase config
4. Set up Firestore security rules
5. Set up Storage security rules

See `FIREBASE_SETUP.md` for detailed instructions.

---

## Demo Mode

The system includes demo credentials that work without Firebase:

- **Admin:** admin@demo.com / demo123
- **User:** user@demo.com / demo123

In demo mode:
- Authentication works via localStorage
- All other features require Firebase setup
- Data is not persisted

---

## Rate Limiting & Best Practices

1. **Batch Operations**: Use bulk APIs when fetching multiple related items
2. **Caching**: Cache frequently accessed data (categories, featured content)
3. **Pagination**: For large lists, implement pagination
4. **Error Handling**: Always handle errors gracefully
5. **Loading States**: Show loading indicators during API calls

---

## Support

For issues or questions:
1. Check Firebase console for errors
2. Verify Firebase configuration in `/lib/firebase.ts`
3. Check browser console for detailed error messages
4. Ensure Firestore and Storage security rules are properly set

---

**Last Updated:** January 2024  
**Version:** 1.0.0
