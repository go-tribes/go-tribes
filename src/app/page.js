"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function HomePage() {
  const [topProfiles, setTopProfiles] = useState([]);

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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white text-gray-900">
      {/* Header */}
      <header className="flex justify-between items-center p-6 border-b border-yellow-300 bg-white">
        <div className="flex items-center space-x-3">
          <Image src="/verticallogo.jpg" alt="Go-Tribes Logo" width={40} height={40} className="rounded" />
          <h1 className="text-3xl font-extrabold tracking-tight">Go-Tribes</h1>
        </div>
        <div>
          <Link href="/login" className="px-4 py-2 mr-2 border border-yellow-500 text-yellow-600 font-semibold rounded hover:bg-yellow-500 hover:text-white">Login</Link>
          <Link href="/register" className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600">Register</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-6">
        <h2 className="text-5xl font-bold mb-4 text-yellow-600">Discover. Plan. Share.</h2>
        <p className="text-lg text-gray-600 mb-6">Explore travel experiences and tribes like never before.</p>
        <Link href="/register" className="px-6 py-3 text-lg font-semibold bg-yellow-500 text-white rounded hover:bg-yellow-600">
          Get Started
        </Link>
      </section>

      {/* Top Shared Profiles */}
      <section className="px-6 py-12 bg-yellow-50">
        <h3 className="text-2xl font-bold mb-6 text-center text-yellow-700">Top Shared Profiles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {topProfiles.map(profile => (
            <div key={profile.id} className="bg-white rounded-xl p-4 text-center shadow-md border border-yellow-200">
              <Image src={profile.profileImage || "/default-avatar.png"} alt={profile.displayName} width={80} height={80} className="rounded-full mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-yellow-700">{profile.displayName}</h4>
              <p className="text-sm text-gray-500 mb-2">Rank: {profile.tribeRank || "Explorer"}</p>
              <p className="text-sm text-gray-700">Trips Shared: {profile.sharedTrips || 0}</p>
              <Link href={`/profile/${profile.id}`} className="mt-3 inline-block text-yellow-600 hover:underline">View Profile</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-sm text-gray-500 py-6 border-t border-yellow-200 bg-white">
        &copy; {new Date().getFullYear()} Go-Tribes. All rights reserved.
      </footer>
    </div>
  );
}
