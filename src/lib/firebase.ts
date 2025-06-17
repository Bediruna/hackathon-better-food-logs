import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBhYynuD6ryGdbi5B36Vp01UPGvSDghTVk",
  authDomain: "hackathon-better-food-logs.firebaseapp.com",
  projectId: "hackathon-better-food-logs",
  storageBucket: "hackathon-better-food-logs.firebasestorage.app",
  messagingSenderId: "706787548505",
  appId: "1:706787548505:web:f2fd3b7c32ddd2c26d8048",
  measurementId: "G-FP9TLV3RX6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;