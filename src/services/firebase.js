import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
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
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyD5P3vOVgyZORM3sOOKGQ80j8j_-ER2YHO",
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
export const functions = getFunctions(app);
export {
  addDoc,
  arrayUnion,
  collection,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getIdTokenResult,
  httpsCallable,
  increment,
  onAuthStateChanged,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signOut,
  updateDoc,
  where,
};
