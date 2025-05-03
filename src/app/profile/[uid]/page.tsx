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

  type Notification = {
    id: string;
    [key: string]: any;
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [editMode, setEditMode] = useState(false);

  type Trip = {
    id: string;
    [key: string]: any;
  };

  const [trips, setTrips] = useState<Trip[]>([]);
  const [likes, setLikes] = useState<{ [key: string]: boolean }>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [comments, setComments] = useState<{ [key: string]: { user: string; text: string }[] }>({});
  const [tribeFriends, setTribeFriends] = useState<string[]>([]);

  type Request = {
    id: string;
    displayName: string;
    [key: string]: any;
  };

  const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
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
      setPendingRequests(pendingSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as { displayName: string }) })));

      const notiSnap = await getDocs(pendingRef);
      setNotifications(notiSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchUserData();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await updateDoc(docRef, profile);
    setEditMode(false);
  };

  const handleImageChange = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    const storageRef = ref(storage, `profiles/${user.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setProfile(prev => ({ ...prev, profileImage: url }));
    await updateDoc(doc(db, "users", user.uid), { profileImage: url });
  };

  const toggleTripPrivacy = async (tripId: string, current: string) => {
    const newStatus = current === "public" ? "tribe-only" : current === "tribe-only" ? "private" : "public";
    await updateDoc(doc(db, "trips", tripId), { privacy: newStatus });
    setTrips(trips.map(t => t.id === tripId ? { ...t, privacy: newStatus } : t));
  };

  const deleteTrip = async (tripId: string) => {
    await deleteDoc(doc(db, "trips", tripId));
    setTrips(trips.filter(t => t.id !== tripId));
  };

  const toggleLike = async (tripId: string) => {
    const tripRef = doc(db, "trips", tripId);
    const alreadyLiked = likes[tripId];
    await updateDoc(tripRef, {
      likes: alreadyLiked ? arrayRemove(user?.uid) : arrayUnion(user?.uid)
    });
    setLikes(prev => ({ ...prev, [tripId]: !alreadyLiked }));
  };

  const toggleBookmark = (tripId: string) => {
    setBookmarks(prev => prev.includes(tripId)
      ? prev.filter(id => id !== tripId)
      : [...prev, tripId]);
  };

  const handleComment = (tripId: string, comment: string) => {
    setComments(prev => ({
      ...prev,
      [tripId]: [...(prev[tripId] || []), { user: profile.displayName, text: comment }]
    }));
  };

  const sendFriendRequest = async () => {
    const result = await getDocs(query(collection(db, "users"), where("email", "==", searchEmail)));
    if (!result.empty) {
      const targetUser = result.docs[0];
      const targetId = targetUser.id;
      await setDoc(doc(db, "users", targetId, "requests", user!.uid), {
        from: user!.uid,
        displayName: profile.displayName
      });
      alert("Friend request sent!");
    } else {
      alert("User not found");
    }
    setSearchEmail("");
  };

  const acceptRequest = async (fromId: string, fromName: string) => {
    await setDoc(doc(db, "users", user!.uid, "friends", fromId), { name: fromName });
    await setDoc(doc(db, "users", fromId, "friends", user!.uid), { name: profile.displayName });
    await deleteDoc(doc(db, "users", user!.uid, "requests", fromId));
    setPendingRequests(pendingRequests.filter(r => r.id !== fromId));
    setTribeFriends([...tribeFriends, fromId]);
  };

  return (
    <div className="min-h-screen bg-yellow-50 px-4 py-8 text-sm text-gray-800">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl border border-yellow-200 shadow-sm">
        {/* Profile content here */}
        <h2 className="text-yellow-700 font-semibold mb-4">My Profile</h2>
        {/* Add UI elements back here as needed */}
      </div>
    </div>
  );
}
