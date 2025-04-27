"use client";

import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [trips, setTrips] = useState([]);

  const adminPassword = "gotribesadmin"; // Admin password

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === adminPassword) {
      setAuthenticated(true);
      fetchTrips();
    } else {
      alert("Incorrect Password");
    }
  };

  const fetchTrips = async () => {
    try {
      const tripsCollection = collection(db, "trips");
      const querySnapshot = await getDocs(tripsCollection);
      const tripsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrips(tripsData);
    } catch (error) {
      console.error("Error fetching trips:", error);
    }
  };

  const handleDeleteTrip = async (tripId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this trip?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "trips", tripId));
      setTrips(trips.filter((trip) => trip.id !== tripId));
      alert("Trip deleted successfully!");
    } catch (error) {
      console.error("Error deleting trip:", error);
      alert("Failed to delete trip.");
    }
  };

  return (
    <>
      <Head>
        <title>Admin Dashboard - Go-Tribes</title>
        <meta name="description" content="Admin panel to monitor trips for Go-Tribes." />
      </Head>

      <main className="p-8 min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200">
        {!authenticated ? (
          <form onSubmit={handlePasswordSubmit} className="flex flex-col space-y-4 max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-6 text-center">Admin Login</h1>
            <input
              type="password"
              placeholder="Enter Admin Password"
              className="p-3 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Access Dashboard
            </button>
          </form>
        ) : (
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-10 text-center text-blue-700">Admin Dashboard</h1>

            {/* Trips Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-6 text-blue-700">All Trips</h2>
              {trips.length === 0 ? (
                <p className="text-gray-600">No trips found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white rounded shadow overflow-hidden">
                    <thead>
                      <tr className="bg-blue-200 text-left">
                        <th className="p-3">Trip ID</th>
                        <th className="p-3">Destination</th>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">End Date</th>
                        <th className="p-3">Notes</th>
                        <th className="p-3">User ID</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trips.map((trip) => (
                        <tr key={trip.id} className="border-t">
                          <td className="p-3">{trip.id}</td>
                          <td className="p-3">{trip.destination}</td>
                          <td className="p-3">{trip.startDate}</td>
                          <td className="p-3">{trip.endDate}</td>
                          <td className="p-3">{trip.notes}</td>
                          <td className="p-3">{trip.userId}</td>
                          <td className="p-3">
                            <button
                              onClick={() => handleDeleteTrip(trip.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
