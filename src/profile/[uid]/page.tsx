"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

type UserProfile = {
  displayName: string;
  tribeRank: string;
  bio: string;
  profileImage: string;
};

type Trip = {
  destination: string;
  startDate: string;
  endDate: string;
  description: string;
};

type Friend = {
  uid: string;
  displayName: string;
  profileImage: string;
};

export default function ProfilePage() {
  const { uid } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const loadProfile = async () => {
      try {
        const userRef = doc(db, "users", uid as string);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        }

        const friendsQuery = query(
          collection(db, "friends"),
          where("userId", "==", uid)
        );
        const friendsSnap = await getDocs(friendsQuery);
        const friendProfiles: Friend[] = [];

        for (const docSnap of friendsSnap.docs) {
          const friendId = docSnap.data().friendId;
          const friendDoc = await getDoc(doc(db, "users", friendId));
          if (friendDoc.exists()) {
            friendProfiles.push({
              uid: friendId,
              displayName: friendDoc.data().displayName,
              profileImage: friendDoc.data().profileImage,
            });
          }
        }

        const tripsQuery = query(
          collection(db, "trips"),
          where("userId", "==", uid),
          where("sharedPublicly", "==", true)
        );
        const tripSnap = await getDocs(tripsQuery);
        const userTrips = tripSnap.docs.map((doc) => doc.data() as Trip);

        setFriends(friendProfiles);
        setTrips(userTrips);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [uid]);

  if (loading) return <div className="p-6 text-gray-500">Loading profile...</div>;
  if (!profile) return <div className="p-6 text-red-500">User not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      {/* Profile Header */}
      <div className="flex gap-6 items-center">
        <img
          src={profile.profileImage || "/default-avatar.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full border shadow"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{profile.displayName}</h1>
          <p className="text-green-600 font-semibold">{profile.tribeRank}</p>
          <p className="text-gray-500 mt-1">{profile.bio}</p>
        </div>
      </div>

      {/* Friends */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Tribe Friends</h2>
        {friends.length === 0 ? (
          <p className="text-gray-400 italic">No friends added yet.</p>
        ) : (
          <div className="flex gap-4 flex-wrap">
            {friends.map((friend) => (
              <div key={friend.uid} className="text-center w-20">
                <img
                  src={friend.profileImage || "/default-avatar.png"}
                  alt={friend.displayName}
                  className="w-16 h-16 rounded-full mx-auto border"
                />
                <p className="text-xs mt-1 truncate">{friend.displayName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Trips */}
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Shared Trips</h2>
        {trips.length === 0 ? (
          <p className="text-gray-400 italic">No trips shared publicly.</p>
        ) : (
          <div className="space-y-4">
            {trips.map((trip, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow">
                <h3 className="text-lg font-bold text-blue-700">{trip.destination}</h3>
                <p className="text-sm text-gray-600">
                  {trip.startDate} → {trip.endDate}
                </p>
                <p className="mt-2 text-gray-700">{trip.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
