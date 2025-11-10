// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Helper to sanitize .env values: removes surrounding quotes/backticks and trailing commas
const clean = (v: any) => (typeof v === 'string' ? v.trim().replace(/^['"`]+|[,'"`]+$/g, '') : v);

// Vite import meta typing helper
declare const importMeta: ImportMeta;
const env = (typeof import.meta !== 'undefined' ? (import.meta as any).env : (importMeta as any).env) || {};

// Firebase configuration from Vite environment variables
// Make sure to define these in your .env file with VITE_ prefix
const firebaseConfig = {
  apiKey: clean(env.VITE_FIREBASE_API_KEY),
  authDomain: clean(env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: clean(env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: clean(env.VITE_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(env.VITE_FIREBASE_APP_ID),
};

// Validate required env vars for clearer errors during development
const missingKeys = Object.entries(firebaseConfig)
  .filter(([_, v]) => !v)
  .map(([k]) => k);
if (missingKeys.length) {
  // eslint-disable-next-line no-console
  console.error(
    `Firebase config missing keys: ${missingKeys.join(', ')}.\n` +
    'Ensure your .env at project root has VITE_FIREBASE_* values and restart the dev server.'
  );
}

// Extra sanity check: appId and messagingSenderId should belong to the same app
try {
  const msid = String(firebaseConfig.messagingSenderId || '').trim();
  const appId = String(firebaseConfig.appId || '').trim();
  const appIdSender = appId.startsWith('1:') ? appId.split(':')[1] : '';
  if (msid && appIdSender && msid !== appIdSender) {
    // eslint-disable-next-line no-console
    console.error(
      `Firebase config mismatch: appId (${appId}) and messagingSenderId (${msid}) look like different apps.\n` +
      'Copy a single coherent Web App config from Firebase Console → Project settings → Your apps, update all VITE_FIREBASE_* values, then restart.'
    );
  }
} catch {}

// Initialize Firebase SDKs (modular v9)
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Note: We intentionally do not initialize Analytics here to avoid SSR/runtime issues.
