"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [topProfiles, setTopProfiles] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchTopProfiles = async () => {
      const profilesSnapshot = await getDocs(collection(db, "users"));
      const profilesData = profilesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedProfiles = profilesData.sort((a, b) => (b.sharedTrips || 0) - (a.sharedTrips || 0));
      setTopProfiles(sortedProfiles.slice(0, 6));
    };
    fetchTopProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-gray-700">
        <h1 className="text-3xl font-bold tracking-tight">Go-Tribes</h1>
        <div>
          {user ? (
            <button onClick={() => router.push("/dashboard")} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Dashboard</button>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 mr-2 border border-white rounded hover:bg-white hover:text-black">Login</Link>
              <Link href="/register" className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">Register</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h2 className="text-5xl font-bold mb-4">Discover. Plan. Share.</h2>
        <p className="text-lg text-gray-300 mb-6">Explore travel experiences and tribes like never before.</p>
        <button onClick={() => router.push(user ? "/dashboard" : "/register")} className="px-6 py-3 text-lg font-semibold bg-blue-600 rounded hover:bg-blue-500">
          {user ? "Go to Dashboard" : "Start Planning"}
        </button>
      </section>

      {/* Top Shared Profiles */}
      <section className="px-6 py-12 bg-gray-900">
        <h3 className="text-2xl font-bold mb-6 text-center">Top Shared Profiles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {topProfiles.map(profile => (
            <div key={profile.id} className="bg-gray-800 rounded-xl p-4 text-center shadow-md">
              <Image src={profile.profileImage || "/default-avatar.png"} alt={profile.displayName} width={80} height={80} className="rounded-full mx-auto mb-4" />
              <h4 className="text-lg font-semibold">{profile.displayName}</h4>
              <p className="text-sm text-gray-400 mb-2">Rank: {profile.tribeRank || "Explorer"}</p>
              <p className="text-sm">Trips Shared: {profile.sharedTrips || 0}</p>
              <Link href={`/profile/${profile.id}`} className="mt-3 inline-block text-blue-400 hover:underline">View Profile</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-400 py-6 border-t border-gray-700">
        &copy; {new Date().getFullYear()} Go-Tribes. All rights reserved.
      </footer>
    </div>
  );
}
