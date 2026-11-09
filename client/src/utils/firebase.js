
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY || "AIzaSyCBt-SDc61nXKYpBP8qT42FrVZdCWgHAPY",
  authDomain: "interview-buddy-94b2d.firebaseapp.com",
  projectId: "interview-buddy-94b2d",
  storageBucket: "interview-buddy-94b2d.firebasestorage.app",
  messagingSenderId: "36724788322",
  appId: "1:36724788322:web:86609faea10f3c37d1d53b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider()

export {auth , provider}