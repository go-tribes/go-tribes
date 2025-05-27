import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  getDoc
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Autocomplete } from "@react-google-maps/api";
import { differenceInDays, parseISO } from "date-fns";

declare global {
  interface Window {
    google: any;
  }
}

export default function TripPlanner() {
  const router = useRouter();

  // 📍 Planner Inputs
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState(0);

  // 👤 User & Trip
  const [userId, setUserId] = useState<string | null>(null);
  const [userTrips, setUserTrips] = useState<any[]>([]);

  // 📅 Modal + Daily Plan
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dailyPlans, setDailyPlans] = useState<any[]>([]);
  const [newActivity, setNewActivity] = useState({
    place: "",
    time: "",
    transport: "",
    cost: "",
  });

  // 🤖 AI Support
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [profileIntro, setProfileIntro] = useState("");

  // 🔗 Refs
  const destAutoRef = useRef<any>(null);
  const destInputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        const q = query(collection(db, "users", user.uid, "trips"));
        const snapshot = await getDocs(q);
        const trips = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUserTrips(trips);
      } else {
        router.push("/login");
      }
    });

    const stored = localStorage.getItem("tripInfo");
    if (stored) {
      const parsed = JSON.parse(stored);
      setDestination(parsed.destination || "");
      setStartDate(parsed.startDate || "");
      setEndDate(parsed.endDate || "");
    }

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const dayDiff = differenceInDays(end, start) + 1;
      setDays(dayDiff > 0 ? dayDiff : 0);
    }
  }, [startDate, endDate]);
  useEffect(() => {
    if (!modalOpen || !userId || !destination) return;

    const fetchSuggestions = async () => {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      const intro = snap.exists() ? snap.data().profileIntro : "";
      setProfileIntro(intro || "");

      const res = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, profileIntro: intro }),
      });

      const data = await res.json();
      const ideas = data.suggestions
        .split(/\d\.\s|\\n|•\s/)
        .filter(Boolean)
        .slice(0, 3);

      setAiSuggestions(ideas);
    };

    fetchSuggestions();
  }, [modalOpen, userId, destination]);
  const handleDestinationChanged = () => {
    if (destAutoRef.current) {
      const place = destAutoRef.current.getPlace();
      if (place?.name) setDestination(place.name);
    }
  };

  const handleSaveTrip = async () => {
    if (!userId) return;
    const trip = {
      destination,
      startDate,
      endDate,
      estimatedExpenses,
      days,
      itinerary: dailyPlans,
      createdAt: new Date(),
    };
    await addDoc(collection(db, "users", userId, "trips"), trip);
    alert("Trip saved!");
    setDailyPlans([]);
  };

  const handleAddActivity = () => {
    if (selectedDay === null) return;
    const updated = [...dailyPlans];
    const index = updated.findIndex(p => p.day === selectedDay);
    const activity = { ...newActivity };
    if (index > -1) {
      updated[index].activities.push(activity);
    } else {
      updated.push({ day: selectedDay, activities: [activity] });
    }
    setDailyPlans(updated);
    setNewActivity({ place: "", time: "", transport: "", cost: "" });
    setModalOpen(false);
  };

  const estimatedExpenses = dailyPlans.reduce((total, plan) => {
    const dayCost = plan.activities.reduce((sum: number, a: any) => sum + Number(a.cost || 0), 0);
    return total + dayCost;
  }, 0);
  useEffect(() => {
    if (!modalOpen) return;

    const loadMap = () => {
      if (!mapRef.current || !window.google) return;

      const defaultLocation = { lat: 3.139, lng: 101.6869 };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          initMap({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => initMap(defaultLocation)
      );
    };

    const initMap = (center: any) => {
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
      });
      mapInstanceRef.current = map;

      const service = new window.google.maps.places.PlacesService(map);

      service.nearbySearch(
        { location: center, radius: 1000, type: "tourist_attraction" },
        (results: any, status: any) => {
          if (status === "OK" && results) {
            results.forEach((place: any) => {
              const marker = new window.google.maps.Marker({
                map,
                position: place.geometry.location,
                title: place.name,
              });
              marker.addListener("click", () => {
                setNewActivity((prev) => ({
                  ...prev,
                  place: place.name,
                }));
              });
              markersRef.current.push(marker);
            });
          }
        }
      );

      if (searchInputRef.current) {
        const searchBox = new window.google.maps.places.SearchBox(searchInputRef.current);
        map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchInputRef.current);

        searchBox.addListener("places_changed", () => {
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;

          const place = places[0];
          if (!place.geometry || !place.geometry.location) return;

          map.panTo(place.geometry.location);
          map.setZoom(15);

          const marker = new window.google.maps.Marker({
            map,
            position: place.geometry.location,
            title: place.name,
          });
          marker.addListener("click", () => {
            setNewActivity((prev) => ({
              ...prev,
              place: place.name,
            }));
          });
        });
      }
    };

    setTimeout(loadMap, 100);
  }, [modalOpen]);
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="bg-blue-900 text-white px-6 py-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Trip Planner</h1>
          <nav className="space-x-4">
            <a href="/home" className="hover:underline">Home</a>
            <a href="/trip-planner" className="hover:underline">Planner</a>
            <a href="/profile" className="hover:underline">Profile</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Plan Your Trip</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium mb-1">Destination</label>
            <Autocomplete
              onLoad={(auto) => (destAutoRef.current = auto)}
              onPlaceChanged={handleDestinationChanged}
            >
              <input
                ref={destInputRef}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full border p-3 rounded"
                placeholder="Search destination..."
              />
            </Autocomplete>

            <label className="block mt-4 font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border p-3 rounded"
            />

            <label className="block mt-4 font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border p-3 rounded"
            />

            <label className="block mt-4 font-medium mb-1">Days</label>
            <input
              type="number"
              value={days}
              disabled
              className="w-full border p-3 rounded bg-gray-100"
            />

            <div className="mt-4 p-3 border bg-gray-100 rounded">
              <span className="font-semibold">Estimated Expenses:</span> RM {estimatedExpenses}
            </div>

            <button
              onClick={handleSaveTrip}
              className="mt-6 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              Save Trip
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Itinerary</h3>
            {Array.from({ length: days }).map((_, i) => (
              <div
                key={i}
                onClick={() => {
                  setSelectedDay(i + 1);
                  setModalOpen(true);
                }}
                className="border p-3 rounded mb-2 hover:bg-blue-50 cursor-pointer"
              >
                <strong>Day {i + 1}</strong>
                <ul className="text-sm text-gray-600 mt-1">
                  {dailyPlans.find((p) => p.day === i + 1)?.activities.map((a: any, idx: number) => (
                    <li key={idx}>
                      📍 {a.place}, ⏰ {a.time}, 🚗 {a.transport}, 💰 RM {a.cost}
                    </li>
                  )) || <li className="italic text-gray-400">No plans yet</li>}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-5xl p-6 rounded shadow flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-2/3 h-[400px] relative">
              <input
                ref={searchInputRef}
                placeholder="Search places..."
                className="absolute top-2 left-2 w-[300px] z-10 p-2 rounded border bg-white"
              />
              <div id="map" ref={mapRef} className="w-full h-full rounded border" />
            </div>

            <div className="w-full md:w-1/3">
              <h3 className="text-lg font-bold mb-2">Add Activity for Day {selectedDay}</h3>

              <label className="block text-sm mb-1">Selected Place</label>
              <input
                type="text"
                value={newActivity.place}
                readOnly
                className="w-full border p-2 rounded bg-gray-100"
              />

              <label className="block mt-4 text-sm mb-1">Time</label>
              <select
                value={newActivity.time}
                onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                className="w-full border p-2 rounded"
              >
                {Array.from({ length: 48 }).map((_, i) => {
                  const hour = String(Math.floor(i / 2)).padStart(2, "0");
                  const minute = i % 2 === 0 ? "00" : "30";
                  const time = `${hour}:${minute}`;
                  return <option key={i} value={time}>{time}</option>;
                })}
              </select>

              <label className="block mt-4 text-sm mb-1">Transport</label>
              <input
                type="text"
                value={newActivity.transport}
                onChange={(e) => setNewActivity({ ...newActivity, transport: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <label className="block mt-4 text-sm mb-1">Cost (RM)</label>
              <input
                type="number"
                value={newActivity.cost}
                onChange={(e) => setNewActivity({ ...newActivity, cost: e.target.value })}
                className="w-full border p-2 rounded"
              />

              <div className="mt-6">
                <h4 className="text-md font-semibold mb-2">AI Recommendations</h4>
                {aiSuggestions.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading ideas...</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {aiSuggestions.map((idea, idx) => (
                      <li
                        key={idx}
                        onClick={() => setNewActivity({ ...newActivity, place: idea })}
                        className="cursor-pointer p-2 rounded border hover:bg-blue-100"
                      >
                        {idea}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddActivity}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
