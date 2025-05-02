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
    <div className="min-h-screen bg-yellow-50 text-gray-800 px-4">
      {/* Header */}
      <header className="flex justify-between items-center py-4 px-4 border-b border-yellow-200 bg-white">
        <div>
          <Image src="/verticallogo.jpg" alt="Go-Tribes Logo" width={60} height={60} className="rounded" />
        </div>
        <div className="text-sm">
          <Link href="/login" className="px-3 py-1 border border-yellow-500 text-yellow-600 font-medium rounded hover:bg-yellow-500 hover:text-white mr-2">Login</Link>
          <Link href="/register" className="px-3 py-1 bg-yellow-500 text-white font-medium rounded hover:bg-yellow-600">Register</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-3 text-yellow-600">Discover. Plan. Share.</h2>
        <p className="text-sm text-gray-600 mb-5">Explore travel experiences and tribes like never before.</p>
        <Link href="/register" className="px-5 py-2 text-sm font-medium bg-yellow-500 text-white rounded hover:bg-yellow-600">
          Get Started
        </Link>
      </section>

      {/* Top Shared Profiles */}
      <section className="py-10">
        <div className="flex justify-center mb-6">
          <Image src="/verticallogo.jpg" alt="Go-Tribes Logo" width={60} height={60} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-sm">
          {topProfiles.map(profile => (
            <div key={profile.id} className="bg-white rounded-lg p-4 text-center shadow-sm border border-yellow-100">
              <Image src={profile.profileImage || "/default-avatar.png"} alt={profile.displayName} width={60} height={60} className="rounded-full mx-auto mb-2" />
              <h4 className="font-medium text-yellow-700">{profile.displayName}</h4>
              <p className="text-xs text-gray-500">Rank: {profile.tribeRank || "Explorer"}</p>
              <p className="text-xs text-gray-600">Trips Shared: {profile.sharedTrips || 0}</p>
              <Link href={`/profile/${profile.id}`} className="mt-2 inline-block text-yellow-600 hover:underline text-xs">View Profile</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 py-6 border-t border-yellow-100 bg-white">
        &copy; {new Date().getFullYear()} Go-Tribes. All rights reserved.
      </footer>
    </div>
  );
}
