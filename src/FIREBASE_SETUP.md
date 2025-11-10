# Firebase Setup Guide

This admin dashboard is now fully integrated with Firebase for backend functionality. Follow these steps to set up Firebase for your project.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter your project name
4. Enable Google Analytics (optional)
5. Wait for project creation to complete

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Create your first admin user:
   - Go to **Authentication** > **Users**
   - Click **Add user**
   - Enter admin email and password

## 3. Set up Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Choose "Start in production mode" or "Start in test mode"
3. Select your preferred location
4. The following collections will be created automatically when you use the app:
   - `users` - User management
   - `books` - Books and chapters
   - `audio_contents` - Audio content
   - `audio_series` - Audio series
   - `wallpapers` - Wallpaper gallery
   - `calendar_events` - Calendar events
   - `slide_contents` - Content slides

## 4. Set up Firebase Storage

1. Go to **Storage** > **Get started**
2. Choose security rules (start in test mode for development)
3. The following folders will be created:
   - `books/` - Book covers and chapter audio
   - `audio/` - Audio files and series covers
   - `wallpapers/` - Wallpaper images
   - `slides/` - Slide images
   - `user_avatars/` - User profile pictures

## 5. Configure Firebase in Your App

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" and click **Web app** icon
3. Register your app with a nickname
4. Copy the Firebase configuration object
5. Replace the configuration in `/lib/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## 6. Firestore Security Rules

For production, set up proper security rules in **Firestore Database** > **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only authenticated users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admin-only collections
    match /{collection}/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 7. Storage Security Rules

For Firebase Storage, go to **Storage** > **Rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 8. First Admin User Setup

After enabling authentication, create your first admin user:

1. Go to **Authentication** > **Users** in Firebase Console
2. Click **Add user**
3. Enter email and password
4. After the user is created, you need to set their role to 'admin'
5. Go to **Firestore Database**
6. Create a document in the `users` collection with the user's UID as the document ID
7. Add the following fields:
   ```json
   {
     "id": "user-uid-here",
     "name": "Admin User",
     "email": "admin@yourdomain.com",
     "role": "admin",
     "status": "active",
     "createdAt": "2024-01-01T00:00:00.000Z",
     "updatedAt": "2024-01-01T00:00:00.000Z"
   }
   ```

## 9. Environment Variables (Optional)

For additional security, you can use environment variables:

Create a `.env.local` file in your project root:
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

Then update `/lib/firebase.ts` to use environment variables:
```typescript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
```

## 10. Testing the Setup

1. Update the Firebase configuration in `/lib/firebase.ts`
2. Start your development server
3. Try logging in with your admin credentials
4. All CRUD operations should now work with Firebase backend

## Features Included

### ✅ Authentication
- Firebase Auth integration
- Admin role-based access
- Secure login/logout

### ✅ Database Operations
- **Users Management**: Full CRUD with role management
- **Books Management**: Books with chapters, rich text editor, audio support
- **Audio Management**: Series-based audio content with text
- **Wallpapers Management**: Image gallery with categories and tags
- **Calendar Management**: Events with scheduling and status tracking
- **Slide Management**: Multilingual slides (Hindi/English) with images

### ✅ File Storage
- Image uploads for covers, wallpapers, slides
- Audio file uploads
- User avatar uploads
- Automatic file cleanup on deletion

### ✅ Real-time Features
- Live authentication state
- Real-time data updates
- Error handling and loading states

### ✅ Analytics & Stats
- Dashboard with comprehensive statistics
- Content analytics
- User engagement metrics

## Troubleshooting

### Common Issues:

1. **Authentication not working**: Check if Firebase Auth is enabled and credentials are correct
2. **Permission denied**: Verify Firestore rules and user roles
3. **Storage upload fails**: Check Storage rules and file permissions
4. **Data not loading**: Ensure Firestore has the correct collections and documents

### Support:
- Check Firebase Console for error logs
- Review browser developer tools for client-side errors
- Ensure all Firebase services (Auth, Firestore, Storage) are enabled

Your CMS Admin Dashboard is now ready with full Firebase backend integration! 🎉