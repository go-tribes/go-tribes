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
    destination: string;
    startDate: string;
    endDate: string;
    description: string;
    imageUrls: string[];
    privacy: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setTrips(tripSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trip)));

      const friendsRef = collection(db, "users", currentUser.uid, "friends");
      const friendSnap = await getDocs(friendsRef);
      setTribeFriends(friendSnap.docs.map(doc => doc.id));

      const pendingRef = collection(db, "users", currentUser.uid, "requests");
      const pendingSnap = await getDocs(pendingRef);
      setPendingRequests(pendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Request)));

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
        <h2 className="text-yellow-700 font-semibold mb-4">My Profile</h2>

        {editMode ? (
          <div className="space-y-2">
            <input type="text" value={profile.displayName} onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))} className="w-full border p-1" />
            <input type="text" value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} className="w-full border p-1" />
            <input type="text" value={profile.tribeName} onChange={e => setProfile(p => ({ ...p, tribeName: e.target.value }))} className="w-full border p-1" />
            <button onClick={handleSave} className="bg-yellow-500 text-white px-3 py-1 rounded">Save</button>
          </div>
        ) : (
          <div className="flex items-center space-x-4">
            {profile.profileImage && <Image src={profile.profileImage} alt="Profile" width={80} height={80} className="rounded-full" />}
            <div>
              <h3 className="text-lg font-bold">{profile.displayName}</h3>
              <p>{profile.bio}</p>
              <p className="text-xs text-gray-500">Tribe: {profile.tribeName} • Rank: {getRank(profile.sharedTrips)}</p>
              <button onClick={() => setEditMode(true)} className="text-blue-600 text-xs underline">Edit Profile</button>
            </div>
          </div>
        )}

        <hr className="my-6" />

        <div>
          <h4 className="font-semibold mb-2">My Trips</h4>
          {trips.map(trip => (
            <div key={trip.id} className="border p-3 rounded mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-bold">{trip.destination}</h5>
                  <p className="text-xs">{trip.startDate} to {trip.endDate}</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => toggleTripPrivacy(trip.id, trip.privacy)} className="text-xs text-gray-600 underline">{trip.privacy}</button>
                  <button onClick={() => deleteTrip(trip.id)} className="text-xs text-red-600 underline">Delete</button>
                </div>
              </div>
              <p className="mt-2">{trip.description}</p>
              <div className="mt-2 flex space-x-2">
                <button onClick={() => toggleLike(trip.id)} className="text-xs">{likes[trip.id] ? "Unlike" : "Like"}</button>
                <button onClick={() => toggleBookmark(trip.id)} className="text-xs">{bookmarks.includes(trip.id) ? "Unbookmark" : "Bookmark"}</button>
              </div>
              <div className="mt-2">
                <input type="text" placeholder="Add comment" onKeyDown={e => {
                  if (e.key === "Enter") handleComment(trip.id, (e.target as HTMLInputElement).value);
                }} className="border px-2 py-1 w-full" />
                <ul className="mt-1 space-y-1">
                  {(comments[trip.id] || []).map((c, i) => <li key={i} className="text-xs">{c.user}: {c.text}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <hr className="my-6" />

        <div>
          <h4 className="font-semibold mb-2">Add Tribe Friend</h4>
          <div className="flex space-x-2">
            <input type="email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="Search by email" className="border px-2 py-1 flex-1" />
            <button onClick={sendFriendRequest} className="bg-yellow-500 text-white px-3 py-1 rounded">Send</button>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-2">Pending Requests</h4>
          {pendingRequests.map(req => (
            <div key={req.id} className="flex justify-between items-center border px-3 py-2 rounded mb-2">
              <span>{req.displayName}</span>
              <button onClick={() => acceptRequest(req.id, req.displayName)} className="text-green-600 text-xs">Accept</button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
