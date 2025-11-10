# Mobile (Expo) Setup and Usage Guide

This guide shows how to consume CMS data in your Expo app in a read‑only way (only user display name can be updated). It uses the mobileServices helper we added.

## 1) Install dependencies in your Expo app

- expo install firebase
- If using TypeScript: npm i -D @types/react @types/react-native

## 2) Copy env and Firebase config

Create .env (or use Expo secrets) with the same VITE_FIREBASE_* values as this project. In Expo, you can load them via process.env or app.json/Secrets.

In your Expo app, initialize Firebase once:

```ts path=null start=null
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 3) Bring mobileServices into your app

You can either:
- Copy src/services/mobileServices.tsx into your Expo project and adjust imports to your Firebase db file, or
- Publish this CMS as a package/internal module.

If copying, update:
- import { db } from '../lib/firebase' → point to your app's firebase init file

## 4) Endpoints (read-only JSON)

All functions return plain JS objects you can treat like JSON.

- mobileServices.getHomeData()
  - { slides, wallpapers, books, audios, events }
- mobileServices.getBooks(limit?)
- mobileServices.getBook(id)
- mobileServices.getAudios(limit?)
- mobileServices.getAudio(id)
- mobileServices.getWallpapers(limit?)
- mobileServices.getWallpaper(id)
- mobileServices.getSlides(limit?)            // top slides (multilingual)
- mobileServices.getSlide(id)
- mobileServices.getMiddleSlides(limit?)     // images-only middle slides
- mobileServices.getUpcomingEvents(limit?)
- mobileServices.getAIAudioTree()            // categories → chapters → items (Published only)
- mobileServices.getAIAudioCategory(categoryId)
- mobileServices.getAIAudioChapter(chapterId)
- mobileServices.getUserProfile(userId)
- mobileServices.updateUserName(userId, name) // only allowed write

## 5) Usage examples

Home screen aggregated fetch:

```ts path=null start=null
import { mobileServices } from './services/mobileServices';

const data = await mobileServices.getHomeData();
// data.slides, data.wallpapers, data.books, data.audios, data.events
```

Books, Audios, Wallpapers, Slides (published only):

```ts path=null start=null
const books = await mobileServices.getBooks();
const audios = await mobileServices.getAudios();
const wallpapers = await mobileServices.getWallpapers();
const slides = await mobileServices.getSlides();
```

AI Audio tree (categories → chapters → items):

```ts path=null start=null
const aiTree = await mobileServices.getAIAudioTree();
// Filtered to Published; each item has {id,title,text,audioUrl,duration}
```

Calendar upcoming events:

```ts path=null start=null
const events = await mobileServices.getUpcomingEvents();
```

User profile and updating display name (only allowed mutation):

```ts path=null start=null
const profile = await mobileServices.getUserProfile(userId);
await mobileServices.updateUserName(userId, 'New Name');
```

## 6) Notes

- All endpoints are read‑only except updateUserName.
- Ensure Firestore rules allow read for mobile and restrict writes except user name change as needed.
- Pagination params exist on underlying services; you can pass a limit to mobile methods if required.
- Middle slides are stored in collection middle_slides with fields: { imageUrl, status, featured, priority, linkUrl?, createdAt, updatedAt }.
