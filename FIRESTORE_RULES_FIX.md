# Fix Firestore Security Rules for YouTube Videos

## Error
```
Missing or insufficient permissions
Error code: permission-denied
```

## Solution

You need to update your Firestore security rules to allow writes to the `youtubeVideos` collection.

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab

### Step 2: Update Security Rules

Add the following rules for the `youtubeVideos` collection. Here are two options:

#### Option A: Allow Authenticated Users (Recommended for Development)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // YouTube Videos Collection
    match /youtubeVideos/{videoId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
    
    // Add your existing rules below for other collections
    // ... your existing rules ...
  }
}
```

#### Option B: Admin-Only Access (Recommended for Production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // YouTube Videos Collection
    match /youtubeVideos/{videoId} {
      allow read: if request.auth != null;
      allow create, update, delete: if isAdmin();
    }
    
    // Add your existing rules below for other collections
    // ... your existing rules ...
  }
}
```

#### Option C: Temporary Development Rules (NOT for Production)

⚠️ **WARNING: Only use this for development/testing!**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // TEMPORARY: Allow all authenticated users to read/write
    // REMOVE THIS IN PRODUCTION!
    match /youtubeVideos/{videoId} {
      allow read, write: if request.auth != null;
    }
    
    // Your existing rules...
  }
}
```

### Step 3: Publish Rules

1. Click **Publish** button in Firebase Console
2. Wait for rules to deploy (usually takes a few seconds)
3. Try adding a video again

### Step 4: Verify Authentication

Make sure you are logged in:
- Check if you're authenticated in your app
- If not, log in first before adding videos

## Quick Test Rules (Development Only)

If you want to quickly test, you can temporarily use these rules (⚠️ NOT SECURE for production):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Remember to update these rules for production with proper security!**

## Common Issues

1. **Still getting permission error?**
   - Make sure you clicked "Publish" in Firebase Console
   - Wait 10-30 seconds for rules to propagate
   - Check if you're logged in (check `auth.currentUser`)

2. **Rules not updating?**
   - Clear browser cache
   - Try in incognito mode
   - Check Firebase Console shows the updated rules

3. **Authentication issues?**
   - Verify you're logged in
   - Check Firebase Authentication is enabled
   - Verify user exists in Authentication tab

