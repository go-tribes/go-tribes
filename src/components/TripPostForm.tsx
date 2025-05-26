"use client";

import { useState } from "react";
import { db, auth } from "../firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";

export default function TripPostForm() {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState(1);
  const [interests, setInterests] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("You must be logged in to post.");

    await addDoc(collection(db, "trips"), {
      userId: user.uid,
      userName: user.displayName || "Anonymous",
      userAvatar: user.photoURL || "",
      title,
      destination,
      days,
      interests: interests.split(",").map((i) => i.trim().toLowerCase()),
      createdAt: Timestamp.now(),
    });

    setTitle("");
    setDestination("");
    setDays(1);
    setInterests("");
    alert("✅ Trip shared successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow space-y-4">
      <h2 className="text-lg font-semibold">Share Your Trip</h2>

      <input
        type="text"
        placeholder="Trip title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
        required
      />

      <input
        type="text"
        placeholder="Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
        required
      />

      <input
        type="number"
        placeholder="Trip duration (days)"
        value={days}
        min={1}
        onChange={(e) => setDays(Number(e.target.value))}
        className="w-full p-2 border border-gray-300 rounded"
        required
      />

      <input
        type="text"
        placeholder="Interests (comma-separated)"
        value={interests}
        onChange={(e) => setInterests(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />

      <button
        type="submit"
        className="bg-[#D9A531] text-white w-full py-2 rounded hover:bg-yellow-600"
      >
        Post Trip
      </button>
    </form>
  );
}
