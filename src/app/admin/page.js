"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);

  const ADMIN_EMAIL = "support@go-tribes.com"; // <-- Change this to your real admin email

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else if (currentUser.email !== ADMIN_EMAIL) {
        alert("Access denied. Admins only!");
        router.push("/login");
      } else {
        setUser(currentUser);
        fetchTrips();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Logged out successfully!");
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to logout.");
    }
  };

  if (loading) {
    return (
      <main className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-xl font-semibold text-gray-600">Checking authentication...</p>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Go-Tribes</title>
        <meta name="description" content="Full Admin Panel to monitor trips for Go-Tribes." />
      </Head>

      <main className="p-8 min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-bold text-blue-700">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

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
      </main>
    </>
  );
}
