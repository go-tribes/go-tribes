// firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // << Add auth import

const firebaseConfig = {
  apiKey: "AIzaSyADezc0xnRzZLDMKeblS3Z5VehLVy1Aedk",
  authDomain: "go-tribes.firebaseapp.com",
  projectId: "go-tribes",
  storageBucket: "go-tribes.firebasestorage.app",
  messagingSenderId: "614597557146",
  appId: "1:614597557146:web:8f19341a67aa459d93d823",
  measurementId: "G-TYSHSY1T12"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);    // Firestore Database
export const auth = getAuth(app);        // Firebase Authentication