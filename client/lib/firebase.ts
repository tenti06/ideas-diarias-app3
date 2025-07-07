import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD05cELy3cw_JxiXHhvyA3Z-mZL6d6FKWY",
  authDomain: "ideas-diarias.firebaseapp.com",
  projectId: "ideas-diarias",
  storageBucket: "ideas-diarias.firebasestorage.app",
  messagingSenderId: "794761675861",
  appId: "1:794761675861:web:cfef11eb5d02fe696b80dc",
  measurementId: "G-D4EMD4EHKV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only in browser)
export const analytics =
  typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
