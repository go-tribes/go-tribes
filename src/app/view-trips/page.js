"use client";

import { db, auth } from "../../../firebase";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Head from "next/head";

export default function ViewTrips() {
  const router = useRouter();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        fetchTrips(user.uid);
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchTrips = async (userId) => {
    try {
      const tripsCollection = collection(db, "trips");
      const tripsQuery = query(tripsCollection, where("userId", "==", userId));
      const querySnapshot = await getDocs(tripsQuery);

      const userTrips = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTrips(userTrips);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching trips:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (tripId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this trip?");
    if (!confirmDelete) return;

    toast.success("Trip deleted! You have 5 seconds to undo.");

    const updatedTrips = trips.filter((trip) => trip.id !== tripId);
    setTrips(updatedTrips);

    const timeout = setTimeout(async () => {
      try {
        await deleteDoc(doc(db, "trips", tripId));
        toast.success("Trip permanently deleted!");
      } catch (error) {
        console.error("Error deleting trip:", error);
        toast.error("Failed to permanently delete trip.");
      }
    }, 5000);

    toast((t) => (
      <span>
        Trip deleted
        <button
          onClick={() => {
            clearTimeout(timeout);
            fetchTrips(auth.currentUser.uid);
            toast.dismiss(t.id);
            toast.success("Trip restore canceled! 🎉");
          }}
          className="ml-2 text-blue-600 underline"
        >
          Undo
        </button>
      </span>
    ), { duration: 5000 });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to logout.");
    }
  };

  if (!authChecked) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-100">
        <Toaster position="bottom-right" />
        <p className="text-2xl font-semibold text-gray-600">Checking Authentication...</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-100">
        <Toaster position="bottom-right" />
        <p className="text-2xl font-semibold text-gray-600">Loading Trips...</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>My Saved Trips | Go-Tribes</title>
        <meta name="description" content="View, manage, and organize all your saved trips with Go-Tribes." />
      </Head>

      <main className="p-8 min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100">
        <Toaster position="bottom-right" />

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-700">My Saved Trips 🌏</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push("/trip-planner")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Plan New Trip
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {trips.length === 0 ? (
          <p className="text-gray-600 text-center mt-8">No trips saved yet. Plan your first trip!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => (
              <div key={trip.id} className="bg-white rounded-lg shadow-lg p-6 relative">
                <h2 className="text-2xl font-bold mb-2">{trip.destination}</h2>
                <p className="text-gray-600 mb-1"><strong>Start:</strong> {trip.startDate}</p>
                <p className="text-gray-600 mb-1"><strong>End:</strong> {trip.endDate}</p>
                <p className="text-gray-600 mb-4"><strong>Notes:</strong> {trip.notes}</p>
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="absolute top-2 right-2 text-sm px-3 py-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
