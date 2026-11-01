import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  getIdTokenResult,
} from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getFirestore,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD5P3v0VgyZORM3sOOKGQ80j8j_-ER2YH0",
  authDomain: "ustad-app-c1bde.firebaseapp.com",
  projectId: "ustad-app-c1bde",
  storageBucket: "ustad-app-c1bde.firebasestorage.app",
  messagingSenderId: "1014350566243",
  appId: "1:1014350566243:web:ba5723dc771cb803c0b956",
  measurementId: "G-93P0JM1T9Z",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export {
  addDoc,
  arrayUnion,
  collection,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getIdTokenResult,
  getRedirectResult,
  increment,
  onAuthStateChanged,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateDoc,
  where,
};
