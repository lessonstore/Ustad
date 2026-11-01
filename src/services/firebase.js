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
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { firebaseConfig } from "./firebaseConfig.js";

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
  getDocs,
  onAuthStateChanged,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateDoc,
  where,
  writeBatch,
};
