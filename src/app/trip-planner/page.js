"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import dynamic from "next/dynamic";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

// Dynamic import for TripMap
const TripMap = dynamic(() => import("../components/TripMap"), { ssr: false });

// Load Google Maps "places" library
const libraries = ["places"];

export default function TripPlanner() {
  const router = useRouter();

  const [departFrom, setDepartFrom] = useState("");
  const [destination, setDestination] = useState("");

  const [departCoord, setDepartCoord] = useState(null);
  const [destinationCoord, setDestinationCoord] = useState(null);

  const [departDetails, setDepartDetails] = useState(null);
  const [destinationDetails, setDestinationDetails] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [travelCompanion, setTravelCompanion] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState([]);

  const [departAutoComplete, setDepartAutoComplete] = useState(null);
  const [destinationAutoComplete, setDestinationAutoComplete] = useState(null);

  useEffect(() => {
    fetchRegisteredUsers();
  }, []);

  const fetchRegisteredUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map((doc) => ({
        id: doc.id,
        email: doc.data().email,
      }));
      setRegisteredUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const onLoadDepart = (autocomplete) => setDepartAutoComplete(autocomplete);
  const onLoadDestination = (autocomplete) => setDestinationAutoComplete(autocomplete);

  const onPlaceChangedDepart = () => {
    if (departAutoComplete) {
      const place = departAutoComplete.getPlace();
      setDepartFrom(place.formatted_address || place.name || "");

      if (place.geometry) {
        setDepartCoord({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }

      setDepartDetails({
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        place_id: place.place_id,
      });
    }
  };

  const onPlaceChangedDestination = () => {
    if (destinationAutoComplete) {
      const place = destinationAutoComplete.getPlace();
      setDestination(place.formatted_address || place.name || "");

      if (place.geometry) {
        setDestinationCoord({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }

      setDestinationDetails({
        name: place.name,
        address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        place_id: place.place_id,
      });
    }
  };

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

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
      libraries={libraries}
    >
      <main className="flex min-h-screen">
        {/* Left Side Form */}
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
            {/* Depart From Field */}
            <div>
              <label className="block mb-2 font-semibold">Depart From</label>
              <Autocomplete
                onLoad={onLoadDepart}
                onPlaceChanged={onPlaceChangedDepart}
                options={{
                  types: ["(cities)"],
                  fields: ["place_id", "geometry", "name", "formatted_address"],
                }}
              >
                <input
                  type="text"
                  value={departFrom}
                  onChange={(e) => setDepartFrom(e.target.value)}
                  className="w-full p-3 border rounded"
                  placeholder="Enter Depart City"
                  required
                />
              </Autocomplete>

              {departDetails && (
                <div className="mt-2 text-sm text-gray-600">
                  <div><strong>Name:</strong> {departDetails.name}</div>
                  <div><strong>Address:</strong> {departDetails.address}</div>
                </div>
              )}
            </div>

            {/* Destination Field */}
            <div>
              <label className="block mb-2 font-semibold">Destination</label>
              <Autocomplete
                onLoad={onLoadDestination}
                onPlaceChanged={onPlaceChangedDestination}
                options={{
                  fields: ["place_id", "geometry", "name", "formatted_address"],
                }}
              >
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-3 border rounded"
                  placeholder="Enter Destination Place"
                  required
                />
              </Autocomplete>

              {destinationDetails && (
                <div className="mt-2 text-sm text-gray-600">
                  <div><strong>Name:</strong> {destinationDetails.name}</div>
                  <div><strong>Address:</strong> {destinationDetails.address}</div>
                </div>
              )}
            </div>

            {/* Date Fields */}
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

            {/* Invite Companion */}
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

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Trip
            </button>
          </form>
        </div>

        {/* Right Side Map */}
        <div className="hidden md:flex w-1/2 p-8">
          <TripMap
            departCoord={departCoord}
            destinationCoord={destinationCoord}
            departFrom={departFrom}
            destination={destination}
          />
        </div>
      </main>
    </LoadScript>
  );
}
