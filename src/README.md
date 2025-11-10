# CMS Admin - Multilingual Content Management System

A beautiful, feature-rich Content Management System with Firebase backend, built for managing multilingual content (English & Hindi) across books, audio, wallpapers, calendar events, and slides. Perfect for spiritual, educational, or cultural content platforms.

![CMS Admin](https://img.shields.io/badge/version-1.0.0-orange) ![Firebase](https://img.shields.io/badge/backend-Firebase-yellow) ![React](https://img.shields.io/badge/framework-React-blue) ![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)

## ✨ Features

### 🎯 Core Features
- **Dashboard** - Analytics and system overview
- **User Management** - Manage users, roles, and profiles with image upload
- **Books Management** - Bilingual books with chapters and audio narrations
- **Audio Management** - Bhajan and Talks categories with text and audio
- **AI Audio Management** - Hierarchical structure (Categories → Chapters → Items) for AI-generated content
- **Wallpapers** - Categorized wallpapers with featured content
- **Calendar** - Event management with bilingual support
- **Slides** - Content slides with multilingual support

### 🌍 Multilingual Support
- **English & Hindi** - Full bilingual support for all content
- **Easy to extend** - Add more languages easily

### 🔐 Authentication
- **Firebase Auth** - Secure authentication
- **Demo Mode** - Works without Firebase setup
- **Role-based Access** - Admin, Premium, User roles

### 📱 Mobile Ready
- **Firebase Integration** - Direct Firestore access from mobile apps
- **Complete API** - Full REST-like API structure
- **Offline Support** - Firebase offline persistence
- **Cross-platform** - Works with React Native, Flutter, iOS, Android

## 🚀 Quick Start

### Demo Mode (No Setup Required)

```bash
# Login credentials
Email: admin@demo.com
Password: demo123
```

Just login and start exploring! No Firebase setup needed for demo.

### Full Setup (5 Minutes)

1. **Clone & Install**
   ```bash
   git clone <repository-url>
   cd cms-admin
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Login with Demo Credentials**
   - Email: `admin@demo.com`
   - Password: `demo123`

4. **Explore All Features!**

**For Production:** See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) to connect Firebase.

## 📖 Documentation

| Document | Description |
|----------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | Get started in minutes |
| **[API_GUIDE.md](./API_GUIDE.md)** | Complete API reference with examples |
| **[MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)** | Mobile app integration guide |
| **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** | Firebase setup instructions |

## 🎨 Screenshots

### Dashboard
Beautiful overview with statistics and quick actions.

### User Management
- View all users
- Edit profiles with image upload
- Role management
- Ban/delete users

### Books Management
- Bilingual content (English/Hindi)
- Chapter management
- Audio narration upload
- Cover image upload

### AI Audio Management (NEW!)
Hierarchical structure perfect for AI-generated content:
```
Categories
  └─ Chapters
      └─ Audio Items
          ├─ Text
          └─ Audio File
```

### Audio Management
- **Bhajan** - Devotional songs
- **Talks** - Spiritual talks
- Audio file upload
- Associated text/lyrics

### Wallpapers
- Multiple categories (Deities, Nature, Festivals, Abstract)
- Featured wallpapers
- Download tracking

### Calendar & Events
- Bilingual event management
- Date/time tracking
- Category organization

### Slides
- Content slides
- Multilingual support
- Order management

## 🏗️ Architecture

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Lucide React** - Icons

### Backend
- **Firebase Auth** - Authentication
- **Firestore** - NoSQL database
- **Firebase Storage** - File storage
- **Security Rules** - Access control

### Project Structure
```
├── /components          # UI components
│   ├── /ui             # shadcn/ui components
│   ├── dashboard-overview.tsx
│   ├── users-management.tsx
│   ├── books-management.tsx
│   ├── audio-management.tsx
│   ├── ai-audio-management.tsx    # NEW!
│   ├── wallpapers-management.tsx
│   ├── calendar-management.tsx
│   └── slide-management.tsx
├── /services           # API services
│   ├── authService.ts
│   ├── userService.ts
│   ├── bookService.ts
│   ├── audioService.ts
│   ├── aiAudioService.ts           # NEW!
│   ├── wallpaperService.ts
│   ├── calendarService.ts
│   ├── slideService.ts
│   └── dashboardService.ts
├── /lib                # Configuration
│   └── firebase.ts
├── /types              # TypeScript types
├── /hooks              # React hooks
└── /styles             # Global styles
```

## 🔧 API Services

### Available Services

| Service | Purpose | Key Features |
|---------|---------|--------------|
| `authService` | Authentication | Login, logout, demo mode |
| `userService` | User management | CRUD, profile images |
| `bookService` | Books & chapters | Bilingual, audio narration |
| `audioService` | Bhajan & Talks | Audio upload, text association |
| `aiAudioService` | AI Audio | Categories → Chapters → Items |
| `wallpaperService` | Wallpapers | Image upload, categorization |
| `calendarService` | Events | Bilingual, date range queries |
| `slideService` | Slides | Multilingual, ordering |
| `dashboardService` | Analytics | Stats, activity tracking |

### Example Usage

```typescript
import { bookService } from './services';

// Get all books
const result = await bookService.getAllBooks();
if (result.success) {
  console.log(result.data);
}

// Get book with chapters
const book = await bookService.getBookById('book_123');
const chapters = await bookService.getChaptersByBook('book_123');
```

See [API_GUIDE.md](./API_GUIDE.md) for complete documentation.

## 📱 Mobile App Integration

### Quick Integration (3 Steps)

1. **Install Firebase SDK**
   ```bash
   # React Native
   npm install @react-native-firebase/app @react-native-firebase/firestore
   
   # Flutter
   # Add firebase_core and cloud_firestore to pubspec.yaml
   ```

2. **Connect to Firebase**
   ```typescript
   // Use the same Firebase project as the web admin
   import firestore from '@react-native-firebase/firestore';
   ```

3. **Fetch Content**
   ```typescript
   // Get all books
   const books = await firestore()
     .collection('books')
     .where('status', '==', 'Published')
     .get();
   ```

See [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) for detailed examples.

### Firestore Collections

| Collection | Contains |
|------------|----------|
| `books` | Books |
| `bookChapters` | Book chapters |
| `audio` | Bhajan & Talks |
| `aiAudioCategories` | AI audio categories |
| `aiAudioChapters` | AI audio chapters |
| `aiAudioItems` | AI audio items |
| `wallpapers` | Wallpapers |
| `calendarEvents` | Events |
| `slides` | Slides |

## 🎯 Key Features Explained

### AI Audio Management (NEW!)

A hierarchical content structure perfect for AI-generated audio series:

```typescript
Category: "Meditation Music"
  ├─ Chapter: "Morning Meditation"
  │   ├─ Item 1: "Sunrise Meditation" (text + audio)
  │   └─ Item 2: "Energy Awakening" (text + audio)
  └─ Chapter: "Evening Relaxation"
      └─ Item 1: "Peaceful Sunset" (text + audio)
```

**Perfect for:**
- AI-generated meditation tracks
- Motivational speech series
- Educational content series
- Podcast-like content

**APIs:**
```typescript
// Get complete structure
const result = await aiAudioService.getAllCategoriesWithContent();

// Create category
await aiAudioService.createCategory({
  name: "Motivational Speeches",
  description: "AI-generated motivational content",
  status: "Published"
});

// Create chapter
await aiAudioService.createChapter({
  categoryId: "cat_001",
  title: "Daily Motivation",
  description: "Start your day with motivation",
  order: 1
});

// Create audio item
await aiAudioService.createAudioItem({
  chapterId: "chap_101",
  categoryId: "cat_001",
  title: "Believe in Yourself",
  text: "You have within you the strength...",
  status: "Published",
  order: 1
});

// Upload audio file
await aiAudioService.uploadAudioFile(itemId, audioFile);
```

### User Profile Management

Users can now update their profiles:
- Upload profile pictures
- Change name and email
- Admins can modify any user

### Audio Categories

Three types of audio content:
1. **Bhajan** - Devotional songs
2. **Talks** - Spiritual talks and discourses
3. **AI Audio** - AI-generated content in hierarchical structure

## 🔐 Security

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for published content
    match /{document=**} {
      allow read: if resource.data.status == "Published";
    }
    
    // Admin write access
    match /{document=**} {
      allow write: if request.auth != null && 
                     request.auth.token.admin == true;
    }
    
    // Users can update their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == userId;
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;  // Public read
      allow write: if request.auth != null;  // Authenticated write
    }
  }
}
```

## 🛠️ Development

### Prerequisites
- Node.js 16+
- npm or yarn
- Firebase account (for production)

### Installation

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

Create `.env.local`:
```env
# Not needed for demo mode
# Only required for Firebase production setup
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
# ... other Firebase config
```

Or directly edit `/lib/firebase.ts`.

## 🎨 Customization

### Theme Colors

Edit `/styles/globals.css`:
```css
:root {
  --primary: 25 95% 53%; /* Orange (HSL) */
  /* Change to your brand color */
}
```

### Add New Section

1. Create component: `/components/my-section.tsx`
2. Create service: `/services/myService.ts`
3. Add to menu in `/App.tsx`

### Add New Language

1. Extend types with new language fields
2. Update forms to include new language inputs
3. Update services to handle new fields

## 📊 Tech Stack Details

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui | Component library |
| Lucide React | Icons |
| Firebase Auth | Authentication |
| Firestore | Database |
| Firebase Storage | File storage |
| Vite | Build tool |

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

### Common Issues

**Q: Demo login not working?**
- Clear browser cache and try again

**Q: Firebase connection error?**
- Check your Firebase config in `/lib/firebase.ts`
- Verify Firebase project is active

**Q: File upload fails?**
- Check Firebase Storage is enabled
- Verify storage security rules

**Q: Mobile app can't fetch data?**
- Ensure using same Firebase project
- Check Firestore security rules
- Verify collection names match

### Get Help

1. Check [Documentation](#-documentation)
2. Review [API Guide](./API_GUIDE.md)
3. Check Firebase Console for errors
4. Review browser/mobile console logs

## 🎉 What's New

### Version 1.0.0
- ✅ Complete CMS with 8 major sections
- ✅ Demo mode with working credentials
- ✅ Firebase backend integration
- ✅ Bilingual support (EN/HI)
- ✅ User profile management with images
- ✅ Audio categories: Bhajan, Talks
- ✅ **NEW: AI Audio Management** - Hierarchical structure for AI content
- ✅ Complete API documentation
- ✅ Mobile app integration guide
- ✅ Offline support ready
- ✅ Beautiful orange theme

## 🗺️ Roadmap

- [ ] Multi-language admin interface
- [ ] Advanced analytics dashboard
- [ ] Bulk upload features
- [ ] Content scheduling
- [ ] Version history
- [ ] User activity logs
- [ ] Advanced search & filters
- [ ] Export/Import data

## 👏 Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Backend by [Firebase](https://firebase.google.com/)

---

**Made with ❤️ for content creators**

For detailed documentation, see the guides in the project root.
