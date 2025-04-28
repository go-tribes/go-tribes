"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs } from "firebase/firestore";
import Head from "next/head";

export default function TripPlanner() {
  const router = useRouter();

  const [departFrom, setDepartFrom] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [departSuggestions, setDepartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [searchDepart, setSearchDepart] = useState("");
  const [searchDest, setSearchDest] = useState("");

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

  const fetchCities = async (query, setSuggestions) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${query}&limit=5&sort=-population`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": "9901c24740msh1fbce6f9459623cp1975a2jsn55e3cd5f1ffa", // <<< YOUR API KEY
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
          },
        }
      );
      const data = await response.json();
      setSuggestions(data.data || []);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };
  

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCities(searchDepart, setDepartSuggestions);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchDepart]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCities(searchDest, setDestSuggestions);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchDest]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!departFrom || !destination || !startDate || !endDate) {
      alert("Please complete all fields!");
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
    <>
      <Head>
        <title>Plan Your Trip - Go-Tribes</title>
        <meta name="description" content="Plan your next adventure easily with Go-Tribes!" />
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-white via-green-100 to-blue-100">
        <div className="flex justify-between w-full max-w-4xl mb-6">
          <button
            onClick={() => router.push("/view-trips")}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            View Trips
          </button>

          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <h1 className="text-4xl font-bold text-green-700 mb-8">Plan Your Trip ✈️</h1>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-6 w-full max-w-md bg-white p-8 rounded-lg shadow">

          {/* Depart From */}
          <div>
            <label className="block mb-2 font-semibold">Depart From</label>
            <input
              type="text"
              value={searchDepart}
              onChange={(e) => setSearchDepart(e.target.value)}
              className="w-full p-3 border rounded"
              placeholder="Type to search city..."
            />
            {departSuggestions.length > 0 && (
              <ul className="border rounded mt-2 bg-white">
                {departSuggestions.map((city) => (
                  <li
                    key={city.id}
                    onClick={() => {
                      setDepartFrom(`${city.city}, ${city.country}`);
                      setSearchDepart(`${city.city}, ${city.country}`);
                      setDepartSuggestions([]);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {city.city}, {city.country}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Destination */}
          <div>
            <label className="block mb-2 font-semibold">Destination</label>
            <input
              type="text"
              value={searchDest}
              onChange={(e) => setSearchDest(e.target.value)}
              className="w-full p-3 border rounded"
              placeholder="Type to search city..."
            />
            {destSuggestions.length > 0 && (
              <ul className="border rounded mt-2 bg-white">
                {destSuggestions.map((city) => (
                  <li
                    key={city.id}
                    onClick={() => {
                      setDestination(`${city.city}, ${city.country}`);
                      setSearchDest(`${city.city}, ${city.country}`);
                      setDestSuggestions([]);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {city.city}, {city.country}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dates */}
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block mb-2 font-semibold">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border rounded"
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border rounded"
                min={startDate}
                required
              />
            </div>
          </div>

          {/* Travel Companion */}
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

          {/* Submit */}
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
