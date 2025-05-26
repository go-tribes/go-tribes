// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ✅ Your actual config (correctly kept)
const firebaseConfig = {
  apiKey: "AIzaSyCEM2iXqTD9MFKVVlTbdNGs20DnhNfvl6w",
  authDomain: "go-tribes-24e6c.firebaseapp.com",
  projectId: "go-tribes-24e6c",
  storageBucket: "go-tribes-24e6c.firebasestorage.app",
  messagingSenderId: "1074173788285",
  appId: "1:1074173788285:web:f71d42233cab26ef4cb114",
  measurementId: "G-YFVHKS83QF",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// ✅ Export for other files to use
export { db, auth, storage };
