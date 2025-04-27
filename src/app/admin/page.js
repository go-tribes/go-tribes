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
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [tripSearch, setTripSearch] = useState("");

  const ADMIN_EMAIL = "admin@go-tribes.com"; // CHANGE TO YOUR REAL ADMIN EMAIL

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else if (currentUser.email !== ADMIN_EMAIL) {
        alert("Access denied. Admins only!");
        router.push("/login");
      } else {
        setUser(currentUser);
        fetchData();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchData = async () => {
    try {
      const usersCollection = collection(db, "users");
      const tripsCollection = collection(db, "trips");

      const [usersSnap, tripsSnap] = await Promise.all([
        getDocs(usersCollection),
        getDocs(tripsCollection),
      ]);

      const usersData = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const tripsData = tripsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setUsers(usersData);
      setTrips(tripsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDeleteUser = async (uid) => {
    const confirmDelete = window.confirm("Are you sure you want to DELETE this user permanently?");
    if (!confirmDelete) return;

    try {
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setUsers(users.filter((user) => user.uid !== uid));
      } else {
        alert(data.error || "Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user.");
    }
  };

  const handleDeleteTrip = async (tripId) => {
    const confirmDelete = window.confirm("Are you sure you want to DELETE this trip?");
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

  // Filtered Results
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredTrips = trips.filter((t) =>
    t.destination.toLowerCase().includes(tripSearch.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Admin Dashboard - Go-Tribes</title>
        <meta name="description" content="Admin Dashboard to manage users and trips for Go-Tribes." />
      </Head>

      <main className="p-8 min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-bold text-blue-700">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-green-500 text-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold">Total Users</h2>
              <p className="text-3xl mt-2">{users.length}</p>
            </div>
            <div className="bg-blue-500 text-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold">Total Trips</h2>
              <p className="text-3xl mt-2">{trips.length}</p>
            </div>
          </div>

          {/* User Management */}
          <section className="mb-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-green-700">Registered Users</h2>
              <input
                type="text"
                placeholder="Search users..."
                className="p-2 border rounded"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-gray-600">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded shadow overflow-hidden">
                  <thead>
                    <tr className="bg-green-200 text-left">
                      <th className="p-3">User ID</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Email Verified</th>
                      <th className="p-3">Registered At</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="p-3">{user.uid}</td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.emailVerified ? "✅" : "❌"}</td>
                        <td className="p-3">{user.createdAt?.toDate().toLocaleDateString()}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDeleteUser(user.uid)}
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

          {/* Trip Management */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-blue-700">All Trips</h2>
              <input
                type="text"
                placeholder="Search trips..."
                className="p-2 border rounded"
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
              />
            </div>

            {filteredTrips.length === 0 ? (
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
                    {filteredTrips.map((trip) => (
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
