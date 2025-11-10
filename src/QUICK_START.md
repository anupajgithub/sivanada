# Quick Start Guide - CMS Admin

Get started with the CMS Admin system in minutes!

## 🚀 Demo Mode (No Setup Required)

You can start using the CMS immediately with demo credentials:

### Login Credentials
- **Admin Account**: `admin@demo.com` / `demo123`
- **User Account**: `user@demo.com` / `demo123`

### What Works in Demo Mode?
- ✅ Authentication (localStorage-based)
- ✅ Full UI exploration
- ✅ All management interfaces
- ❌ Data persistence (requires Firebase)
- ❌ File uploads (requires Firebase)

---

## 📱 For Mobile App Developers

If you're building a mobile app that connects to this CMS:

### Quick Setup (3 Steps)

1. **Get Firebase Config**
   - Ask your admin for the Firebase configuration
   - Or use the same Firebase project as the web admin

2. **Install Firebase SDK**
   ```bash
   # React Native
   npm install @react-native-firebase/app @react-native-firebase/firestore

   # Flutter
   # Add to pubspec.yaml:
   # firebase_core, cloud_firestore, firebase_storage
   ```

3. **Start Fetching Data**
   ```typescript
   // Example: Get all books
   const books = await firestore()
     .collection('books')
     .where('status', '==', 'Published')
     .get();
   ```

### 📖 Complete Mobile Integration Guide
See [MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md) for detailed examples.

### 📚 API Reference
See [API_GUIDE.md](./API_GUIDE.md) for all available endpoints.

---

## 🔧 For Web Admin Setup

### Option 1: Use Demo Mode (Recommended for Testing)
1. Clone/download the project
2. Run `npm install`
3. Run `npm run dev`
4. Login with demo credentials above
5. Explore all features!

### Option 2: Connect to Firebase (For Production)

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project
   - Enable Authentication, Firestore, and Storage

2. **Get Firebase Config**
   ```javascript
   // From Firebase Console → Project Settings → General
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-app.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-app.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123:web:abc123"
   };
   ```

3. **Update `/lib/firebase.ts`**
   ```typescript
   const firebaseConfig = {
     // Paste your config here
   };
   ```

4. **Set Up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Allow read for published content
       match /books/{bookId} {
         allow read: if resource.data.status == "Published";
         allow write: if request.auth != null && request.auth.token.admin == true;
       }
       
       match /bookChapters/{chapterId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.token.admin == true;
       }
       
       // Similar rules for other collections
     }
   }
   ```

5. **Set Up Storage Security Rules**
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

6. **Create Admin User**
   - Go to Firebase Console → Authentication
   - Add user manually
   - Or use the demo login first, then configure Firebase

7. **Start Using**
   ```bash
   npm run dev
   ```

### 📖 Detailed Setup Guide
See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for step-by-step instructions.

---

## 🎯 Features Overview

### 1. Dashboard
- System statistics
- Recent activity
- Quick actions

### 2. User Management
- View all users
- Edit user profiles (name, image)
- Change user roles
- Ban/delete users

### 3. Books Management
- Manage books with bilingual support (English/Hindi)
- Add/edit chapters
- Upload chapter audio narrations
- Upload book covers

### 4. Audio Management (Bhajan & Talks)
- Manage devotional audio (Bhajan)
- Manage spiritual talks (Talks)
- Upload audio files
- Associate text/lyrics with audio

### 5. AI Audio Management (NEW!)
**Hierarchical Structure**: Categories → Chapters → Audio Items
- Create audio categories
- Add chapters to categories
- Add audio items to chapters
- Each audio item has text and audio file
- Similar to books structure, perfect for AI-generated content series

### 6. Wallpapers Management
- Upload wallpapers
- Categorize by themes
- Mark featured wallpapers
- Track downloads

### 7. Calendar Management
- Manage events with bilingual support
- Set dates and times
- Categorize events (festivals, etc.)

### 8. Slide Management
- Create content slides
- Bilingual support
- Order management
- Featured images

---

## 📊 Content Structure

### Books
```
Books
  └─ Chapters
      └─ Content (EN + HI)
      └─ Audio Narration
```

### AI Audio (NEW!)
```
Categories
  └─ Chapters
      └─ Audio Items
          └─ Text
          └─ Audio File
```

### Audio (Bhajan/Talks)
```
Audio
  └─ Category (bhajan/talks)
  └─ Text/Lyrics
  └─ Audio File
```

---

## 🔐 User Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full access to all features |
| **Premium** | Enhanced user features (future use) |
| **User** | Basic user access |

---

## 📱 Mobile App Collections

Your mobile app should fetch from these Firestore collections:

| Collection | What It Contains |
|------------|-----------------|
| `books` | All books |
| `bookChapters` | Book chapters (linked by `bookId`) |
| `audio` | Bhajan and Talks audio |
| `aiAudioCategories` | AI audio categories |
| `aiAudioChapters` | AI audio chapters (linked by `categoryId`) |
| `aiAudioItems` | AI audio items (linked by `chapterId`) |
| `wallpapers` | Wallpapers |
| `calendarEvents` | Calendar events |
| `slides` | Content slides |

---

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore + Storage + Auth)
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

---

## 📖 Documentation

- **[API_GUIDE.md](./API_GUIDE.md)** - Complete API reference for all services
- **[MOBILE_APP_INTEGRATION.md](./MOBILE_APP_INTEGRATION.md)** - Mobile app integration guide with code examples
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Detailed Firebase setup instructions

---

## 🎨 Customization

### Change Theme Color
The app uses a light orange theme. To change:

1. Edit `/styles/globals.css`
2. Modify CSS variables:
   ```css
   :root {
     --primary: 25 95% 53%; /* Orange color in HSL */
   }
   ```

### Add New Section
1. Create component in `/components/`
2. Create service in `/services/`
3. Add to menu in `/App.tsx`

---

## 🆘 Troubleshooting

### Demo Login Not Working?
- Clear browser cache
- Check browser console for errors
- Try different email format

### Firebase Connection Issues?
- Verify Firebase config in `/lib/firebase.ts`
- Check Firebase Console for project status
- Verify security rules are set up

### File Upload Fails?
- Check Storage security rules
- Verify Firebase Storage is enabled
- Check file size limits

---

## 📞 Support

### Common Questions

**Q: Can I use this without Firebase?**
A: Yes, for testing with demo mode. For production, Firebase is required.

**Q: How do I add more admin users?**
A: Go to Firebase Console → Authentication → Add User

**Q: Can mobile apps write data?**
A: By default, mobile apps should have read-only access. Modify Firestore rules if you need write access.

**Q: Where are images stored?**
A: In Firebase Storage under folders like `/books/`, `/wallpapers/`, etc.

**Q: How do I backup data?**
A: Use Firebase Console → Firestore → Export data

---

## 🚀 Next Steps

1. **Try Demo Mode** - Login and explore
2. **Set Up Firebase** - For production use
3. **Integrate Mobile App** - Follow mobile guide
4. **Customize** - Adjust to your needs
5. **Deploy** - Host on Firebase Hosting or Vercel

---

## 📝 Quick Reference

### Important Files
- `/App.tsx` - Main app structure
- `/lib/firebase.ts` - Firebase configuration
- `/services/*` - All API services
- `/components/*` - UI components

### Collection Names
```typescript
// Use these exact names in your mobile app
const COLLECTIONS = {
  users: 'users',
  books: 'books',
  bookChapters: 'bookChapters',
  audio: 'audio',
  aiAudioCategories: 'aiAudioCategories',
  aiAudioChapters: 'aiAudioChapters',
  aiAudioItems: 'aiAudioItems',
  wallpapers: 'wallpapers',
  calendarEvents: 'calendarEvents',
  slides: 'slides'
};
```

### Status Values
```typescript
// All content uses these status values
type Status = 'Published' | 'Draft';

// Always filter by Published in mobile apps
.where('status', '==', 'Published')
```

---

**Happy Coding! 🎉**

For detailed guides, see the documentation files in this directory.
