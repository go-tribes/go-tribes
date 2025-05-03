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

  type Notification = { id: string; [key: string]: any };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showMessages, setShowMessages] = useState(false);
  const [editMode, setEditMode] = useState(false);

  type Trip = { id: string; [key: string]: any };
  const [trips, setTrips] = useState<Trip[]>([]);
  const [likes, setLikes] = useState<{ [key: string]: boolean }>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [comments, setComments] = useState<{ [key: string]: { user: string; text: string }[] }>({});
  const [tribeFriends, setTribeFriends] = useState<string[]>([]);

  type Request = { id: string; displayName: string };
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
            <input className="w-full border p-1 rounded" value={profile.displayName} onChange={(e) => setProfile({ ...profile, displayName: e.target.value })} />
            <input className="w-full border p-1 rounded" value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
            <input className="w-full border p-1 rounded" value={profile.tribeName} onChange={(e) => setProfile({ ...profile, tribeName: e.target.value })} />
            <button onClick={handleSave} className="bg-yellow-500 text-white px-3 py-1 rounded">Save</button>
          </div>
        ) : (
          <div className="space-y-2">
            <Image src={profile.profileImage || "/default.png"} alt="Profile" width={80} height={80} className="rounded-full" />
            <p><strong>{profile.displayName}</strong></p>
            <p>{profile.bio}</p>
            <p>Tribe: {profile.tribeName || "-"}</p>
            <p>Rank: {getRank(profile.sharedTrips)}</p>
            <button onClick={() => setEditMode(true)} className="text-blue-600 text-xs underline">Edit Profile</button>
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-gray-600 underline">Change Image</button>
          </div>
        )}

        <hr className="my-4" />

        <div>
          <h3 className="font-semibold mb-2">My Trips</h3>
          {trips.map(trip => (
            <div key={trip.id} className="border rounded p-2 mb-2">
              <p className="font-medium">{trip.destination}</p>
              <p>{trip.description}</p>
              <p className="text-xs text-gray-500">Privacy: {trip.privacy}</p>
              <div className="space-x-2 text-xs">
                <button onClick={() => toggleTripPrivacy(trip.id, trip.privacy)}>Toggle Privacy</button>
                <button onClick={() => deleteTrip(trip.id)} className="text-red-500">Delete</button>
                <button onClick={() => toggleLike(trip.id)}>{likes[trip.id] ? "Unlike" : "Like"}</button>
                <button onClick={() => toggleBookmark(trip.id)}>{bookmarks.includes(trip.id) ? "Unsave" : "Save"}</button>
              </div>
              <div className="mt-2">
                <input className="w-full text-xs border p-1" placeholder="Add comment..." onKeyDown={(e) => { if (e.key === "Enter") handleComment(trip.id, e.currentTarget.value) }} />
                {(comments[trip.id] || []).map((c, i) => <p key={i} className="text-xs">{c.user}: {c.text}</p>)}
              </div>
            </div>
          ))}
        </div>

        <hr className="my-4" />

        <div>
          <h3 className="font-semibold mb-2">Add Tribe Friend</h3>
          <input className="w-full border p-1 mb-2" placeholder="Enter email" value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} />
          <button onClick={sendFriendRequest} className="bg-yellow-500 text-white px-3 py-1 rounded">Send Request</button>
        </div>

        {pendingRequests.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Pending Requests</h3>
            {pendingRequests.map(req => (
              <div key={req.id} className="flex justify-between items-center border p-2 mb-1">
                <p>{req.displayName}</p>
                <button onClick={() => acceptRequest(req.id, req.displayName)} className="text-green-600 text-sm">Accept</button>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Notifications</h3>
            {notifications.map(n => <p key={n.id} className="text-xs text-gray-600">{n.displayName} sent you a friend request</p>)}
          </div>
        )}
      </div>
    </div>
  );
}
