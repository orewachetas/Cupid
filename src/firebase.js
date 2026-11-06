import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  query, 
  where,
  orderBy, 
  serverTimestamp, 
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

// Reads from environment variables or uses active user Firebase key for project: cupid-3874c
export function getFirebaseConfig() {
  const savedConfig = localStorage.getItem('cupid_firebase_config');
  if (savedConfig) {
    try {
      const parsed = JSON.parse(savedConfig);
      if (parsed.apiKey && parsed.projectId) return parsed;
    } catch (e) {}
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDHqes3V6Zh38nzQwUUGnDI4I9R2EjOV60",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cupid-3874c.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cupid-3874c",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cupid-3874c.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "337770116871",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:337770116871:web:e8676e91ddac416fd4f7a2",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-5EH4XFH97W"
  };
}

let app = null;
let auth = null;
let db = null;
let isFirebaseConfigured = true;

const config = getFirebaseConfig();

try {
  app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseConfigured = true;
} catch (err) {
  console.warn("Firebase initialization warning:", err);
}

export {
  app,
  auth,
  db,
  isFirebaseConfigured,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  deleteDoc
};
