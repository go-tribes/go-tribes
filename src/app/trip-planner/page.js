"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import dynamic from "next/dynamic";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

const TripMap = dynamic(() => import("../components/TripMap"), { ssr: false });

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
      alert("Start Date must be today or in the future!");
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
      <main className="flex flex-col min-h-screen">
        {/* TOP HALF: Form and Map */}
        <section className="flex flex-row w-full h-1/2">
          {/* Form – Narrow, Premium */}
          <div className="w-1/2 flex justify-center items-start p-6 bg-gradient-to-br from-white via-green-100 to-blue-100 overflow-auto">
            <div className="w-full max-w-md">
              <div className="flex justify-between mb-4">
                <button
                  onClick={() => router.push("/view-trips")}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  View Trips
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Logout
                </button>
              </div>

              <h1 className="text-2xl font-bold text-green-700 mb-6">Plan Your Trip</h1>

              <form onSubmit={handleSubmit} className="flex flex-col space-y-4 text-sm">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Depart From</label>
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
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="City of origin"
                      required
                    />
                  </Autocomplete>
                  {departDetails && (
                    <p className="text-xs text-gray-600 mt-1">{departDetails.name}, {departDetails.address}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-1 font-medium text-gray-700">Destination</label>
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
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="Destination place"
                      required
                    />
                  </Autocomplete>
                  {destinationDetails && (
                    <p className="text-xs text-gray-600 mt-1">{destinationDetails.name}, {destinationDetails.address}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block mb-1 font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none"
                      required
                      min={startDate}
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-medium text-gray-700">Invite Companion</label>
                  <select
                    value={travelCompanion}
                    onChange={(e) => {
                      setTravelCompanion(e.target.value);
                      setManualEmail("");
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">Select registered user</option>
                    {registeredUsers.map((user) => (
                      <option key={user.id} value={user.email}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => {
                      setManualEmail(e.target.value);
                      setTravelCompanion("");
                    }}
                    className="w-full mt-2 p-2 border border-gray-300 rounded"
                    placeholder="Or enter email..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Save Trip
                </button>
              </form>
            </div>
          </div>

          {/* MAP */}
          <div className="w-1/2 h-full">
            <TripMap
              departCoord={departCoord}
              destinationCoord={destinationCoord}
              departFrom={departFrom}
              destination={destination}
            />
          </div>
        </section>

        {/* BOTTOM HALF – Reserved */}
        <section className="w-full h-1/2 p-6 bg-gray-50 border-t">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recommended Destinations (Coming Soon)</h2>
          <div className="text-gray-500 italic">
            This section will show suggested places or trip ideas based on your selected destination.
          </div>
        </section>
      </main>
    </LoadScript>
  );
}
