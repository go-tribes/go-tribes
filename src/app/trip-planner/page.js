"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function TripPlanner() {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setAuthChecked(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in!");
        return;
      }

      await addDoc(collection(db, "trips"), {
        destination,
        startDate,
        endDate,
        notes,
        userId: user.uid, // Save user ID here!
        createdAt: new Date(),
      });

      toast.success("Trip saved successfully! 🎉");

      setDestination("");
      setStartDate("");
      setEndDate("");
      setNotes("");
    } catch (error) {
      console.error("Error saving trip:", error);
      toast.error("Failed to save trip 😢");
    }
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-green-100 via-white to-blue-100">
      <Toaster position="bottom-right" />

      <div className="flex justify-between w-full max-w-4xl mb-8">
        <h1 className="text-4xl font-bold text-green-700">Plan Your Trip ✈️</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/view-trips")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Saved Trips
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Destination"
          className="p-3 border rounded"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          required
        />
        <input
          type="date"
          className="p-3 border rounded"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
        <input
          type="date"
          className="p-3 border rounded"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
        />
        <textarea
          placeholder="Notes about your trip..."
          className="p-3 border rounded h-32"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Save Trip
        </button>
      </form>
    </main>
  );
}
