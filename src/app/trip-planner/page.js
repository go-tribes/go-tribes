"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function TripPlanner() {
  const router = useRouter();

  const [departFrom, setDepartFrom] = useState("");
  const [destination, setDestination] = useState("");
  const [departCoord, setDepartCoord] = useState(null);
  const [destinationCoord, setDestinationCoord] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [travelCompanion, setTravelCompanion] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState([]);

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

  // Geocoding: Convert city to coordinates
  const fetchCoordinates = async (city, setCoordFunc) => {
    if (!city) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setCoordFunc({ lat: parseFloat(lat), lng: parseFloat(lon) });
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
    }
  };

  useEffect(() => {
    fetchCoordinates(departFrom, setDepartCoord);
  }, [departFrom]);

  useEffect(() => {
    fetchCoordinates(destination, setDestinationCoord);
  }, [destination]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!departFrom || !destination || !startDate || !endDate) {
      alert("Please complete all fields!");
      return;
    }

    if (new Date(startDate) < new Date().setHours(0, 0, 0, 0)) {
      alert("Start Date must be today or future!");
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

      alert("Trip saved successfully!");
      router.push("/view-trips");
    } catch (error) {
      console.error("Error saving trip:", error);
      alert("Failed to save trip.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Custom marker icon (to fix missing default icons)
  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  return (
    <>
      <main className="flex min-h-screen">
        {/* Left: Form */}
        <div className="flex flex-col w-full md:w-1/2 p-8 bg-gradient-to-br from-white via-green-100 to-blue-100">
          <div className="flex justify-between mb-6">
            <button
              onClick={() => router.push("/view-trips")}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Trips
            </button>

            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          <h1 className="text-4xl font-bold text-green-700 mb-8">Plan Your Trip ✈️</h1>

          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            <div>
              <label className="block mb-2 font-semibold">Depart From</label>
              <input
                type="text"
                value={departFrom}
                onChange={(e) => setDepartFrom(e.target.value)}
                className="w-full p-3 border rounded"
                placeholder="Enter Depart City"
                required
              />
            </div>

            <div>
              <label className="block mb-2 font-semibold">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-3 border rounded"
                placeholder="Enter Destination City"
                required
              />
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
                <option value="">Select registered user</option>
                {registeredUsers.map((user) => (
                  <option key={user.id} value={user.email}>
                    {user.email}
                  </option>
                ))}
              </select>

              <div className="mt-4">
                <label className="block mb-2 font-semibold">Or Invite by Email</label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => {
                    setManualEmail(e.target.value);
                    setTravelCompanion("");
                  }}
                  className="w-full p-3 border rounded"
                  placeholder="Enter email..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Trip
            </button>
          </form>
        </div>

        {/* Right: Map */}
        <div className="hidden md:flex w-1/2 p-8">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            {departCoord && (
              <Marker position={departCoord} icon={customIcon}>
                <Popup>Depart: {departFrom}</Popup>
              </Marker>
            )}
            {destinationCoord && (
              <Marker position={destinationCoord} icon={customIcon}>
                <Popup>Destination: {destination}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </main>
    </>
  );
}
