"use client";

import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function TripPlanner() {
  const router = useRouter();
  const [departFrom, setDepartFrom] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelCompanion, setTravelCompanion] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [manualEmail, setManualEmail] = useState("");

  const places = [
    "Kuala Lumpur",
    "Penang",
    "Langkawi",
    "Johor Bahru",
    "Singapore",
    "Bangkok",
    "Tokyo",
    "Seoul",
    "London",
    "Paris"
  ];

  useEffect(() => {
    fetchRegisteredUsers();
  }, []);

  const fetchRegisteredUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
      }));
      setRegisteredUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!departFrom || !destination || !startDate || !endDate) {
      alert("Please complete all required fields!");
      return;
    }

    if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
      alert("Start Date must be today or future date!");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      alert("End Date must be after Start Date!");
      return;
    }

    try {
      await addDoc(collection(db, "trips"), {
        departFrom,
        destination,
        startDate,
        endDate,
        companionEmail: manualEmail || travelCompanion,
        createdAt: new Date(),
      });

      if (manualEmail) {
        await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: manualEmail }),
        });
      }

      alert("Trip saved successfully! 🚀");
      router.push("/view-trips");
    } catch (error) {
      console.error("Error saving trip:", error);
      alert("Failed to save trip.");
    }
  };

  return (
    <>
      <Head>
        <title>Plan Your Trip - Go-Tribes</title>
        <meta name="description" content="Create and plan your next travel adventure with Go-Tribes!" />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-white via-green-100 to-blue-100">
        <h1 className="text-4xl font-bold text-green-700 mb-8">Plan Your Trip ✈️</h1>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-6 w-full max-w-md bg-white p-8 rounded-lg shadow">
          <div>
            <label className="block mb-2 font-semibold">Depart From</label>
            <select
              value={departFrom}
              onChange={(e) => setDepartFrom(e.target.value)}
              className="w-full p-3 border rounded"
              required
            >
              <option value="">Select Depart From</option>
              {places.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Destination</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full p-3 border rounded"
              required
            >
              <option value="">Select Destination</option>
              {places.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border rounded"
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border rounded"
                required
                min={startDate}
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-semibold">Invite Travel Companion</label>
            <select
              value={travelCompanion}
              onChange={(e) => {
                setTravelCompanion(e.target.value);
                setManualEmail("");
              }}
              className="w-full p-3 border rounded"
            >
              <option value="">Select Registered User</option>
              {registeredUsers.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.email}
                </option>
              ))}
            </select>
            <div className="mt-4">
              <label className="block mb-2 font-semibold">Or Invite by Email (if not registered)</label>
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => {
                  setManualEmail(e.target.value);
                  setTravelCompanion("");
                }}
                className="w-full p-3 border rounded"
                placeholder="example@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Save Trip
          </button>
        </form>
      </main>
    </>
  );
}
