"use client";

import { useEffect, useState, useRef } from "react";
import type { User } from "firebase/auth";
import { auth, db, storage } from "@/firebase";
import {
  doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, deleteDoc,
  arrayUnion, arrayRemove, setDoc
} from "firebase/firestore";
import {
  ref, uploadBytes, getDownloadURL
} from "firebase/storage";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState({
    displayName: "",
    bio: "",
    tribeName: "",
    profileImage: "",
    sharedTrips: 0,
    privacy: "public"
  });
  const [notifications, setNotifications] = useState([]);
  const [showMessages, setShowMessages] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [trips, setTrips] = useState([]);
  const [likes, setLikes] = useState({});
  const [bookmarks, setBookmarks] = useState([]);
  const [comments, setComments] = useState({});
  const [tribeFriends, setTribeFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const fileInputRef = useRef(null);

  const getRank = (count: number) => {
    if (count >= 45) return "Trailblazer";
    if (count >= 30) return "Pathfinder";
    if (count >= 20) return "Explorer";
    if (count >= 10) return "Scout";
    if (count >= 5) return "Triber";
    return "Newbie";
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return router.push("/login");
      setUser(currentUser);

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as typeof profile);
      }

      const tripsRef = collection(db, "trips");
      const tripQuery = query(tripsRef, where("userId", "==", currentUser.uid));
      const tripSnap = await getDocs(tripQuery);
      setTrips(tripSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const friendsRef = collection(db, "users", currentUser.uid, "friends");
      const friendSnap = await getDocs(friendsRef);
      setTribeFriends(friendSnap.docs.map(doc => doc.id));

      const pendingRef = collection(db, "users", currentUser.uid, "requests");
      const pendingSnap = await getDocs(pendingRef);
      setPendingRequests(pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const notiRef = collection(db, "users", currentUser.uid, "requests");
      const notiSnap = await getDocs(notiRef);
      setNotifications(notiSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUserData();
  }, [router]);

  // ...rest of the code remains unchanged
}
