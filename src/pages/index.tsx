import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import MainLayout from "../components/MainLayout";
import { db } from "../firebase";

const GOOGLE_MAPS_API_KEY = "AIzaSyAiX0893WCTopsnxsnwKKj6iUxLW-72nsM";
const libraries: ("places")[] = ["places"];

export default function Home() {
  const router = useRouter();
  const [autocomplete, setAutocomplete] = useState<any>(null);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sharedTrips, setSharedTrips] = useState<any[]>([]);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const today = new Date().toISOString().split("T")[0];

  const handlePlaceLoad = (auto: any) => setAutocomplete(auto);

  const handlePlaceChange = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      setDestination(place.formatted_address || place.name);
    }
  };

  // Fetch top posts of the week
  useEffect(() => {
    const fetchTopTrips = async () => {
      const now = new Date();
      const monday = new Date(now.setDate(now.getDate() - now.getDay() + 1));
      monday.setHours(0, 0, 0, 0);

      const postsQuery = query(
        collection(db, "tripPosts"),
        where("timestamp", ">=", monday),
        orderBy("timestamp", "desc")
      );

      const snapshot = await getDocs(postsQuery);
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const sortedPosts = posts.sort((a: any, b: any) => {
        const aEngage = (a.likes?.length || 0) + (a.comments?.length || 0);
        const bEngage = (b.likes?.length || 0) + (b.comments?.length || 0);
        return bEngage - aEngage;
      });

      setSharedTrips(sortedPosts.slice(0, 5));
    };

    fetchTopTrips();
  }, []);

  if (loadError) {
    return <div className="text-center p-10 text-red-600">❌ Failed to load Google Maps</div>;
  }

  if (!isLoaded) {
    return <div className="text-center p-10 text-lg">Loading maps...</div>;
  }

  return (
    <MainLayout>
      {/* Softer background for dark mode */}
      <div className="
        min-h-screen w-full
        bg-[#F5F5F4] dark:bg-[#23211b] 
        transition-colors
        py-8 px-2
      ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Main Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow transition-colors">
              <h1 className="text-3xl font-bold mb-2 text-gt-primary dark:text-gt-primary">Welcome to Go-Tribes</h1>
              <p className="text-[#66625B] dark:text-gt-gray mb-4">
                Plan your trips with ease using our AI-powered travel platform.
              </p>
              <button
                className="bg-[#D9A531] text-white px-6 py-2 rounded hover:bg-yellow-600 transition"
                onClick={() => router.push("/plan-trip")}
              >
                Plan Trip
              </button>
            </div>

            {/* Autocomplete Section */}
            <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow space-y-4 transition-colors">
              <h2 className="text-lg font-semibold text-gt-primary dark:text-gt-primary">Plan Your Trip</h2>

              <div>
                <label className="text-sm font-medium block mb-1 text-gt-muted dark:text-gt-gray">Destination</label>
                <Autocomplete onLoad={handlePlaceLoad} onPlaceChanged={handlePlaceChange}>
                  <input
                    type="text"
                    placeholder="Enter destination..."
                    className="w-full p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray transition-colors"
                  />
                </Autocomplete>
                {destination && (
                  <p className="text-sm text-gray-600 dark:text-gt-gray mt-1">Selected: {destination}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-1 text-gt-muted dark:text-gt-gray">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    min={today}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1 text-gt-muted dark:text-gt-gray">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={today}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray transition-colors"
                  />
                </div>
              </div>

              <button
                className="bg-[#D9A531] text-white w-full py-2 rounded hover:bg-yellow-600 transition"
                onClick={() => router.push("/plan-trip")}
              >
                Plan Trip
              </button>
            </div>

            {/* Recent Shared Trips */}
            <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow transition-colors">
              <h2 className="text-lg font-semibold mb-4 text-gt-primary dark:text-gt-primary">🔥 Top Shared Trips This Week</h2>
              <div className="space-y-4">
                {sharedTrips.length === 0 ? (
                  <p className="text-gray-500 dark:text-gt-gray text-sm">No shared trips yet this week.</p>
                ) : (
                  sharedTrips.map((trip, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#333028] p-2 rounded transition-colors"
                      onClick={() => router.push(`/post/${trip.id}`)}
                    >
                      <div className="w-16 h-16 bg-gray-100 dark:bg-[#23211b] rounded overflow-hidden">
                        <Image
                          src={trip.imageUrl || "/default.jpg"}
                          alt={trip.title}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gt-dark dark:text-gt-gray">{trip.title || "Untitled Trip"}</p>
                        <p className="text-sm text-[#66625B] dark:text-gt-gray">{trip.location || "Unknown"}</p>
                        <p className="text-xs text-gray-500 dark:text-gt-gray">
                          ❤️ {trip.likes?.length || 0} · 💬 {trip.comments?.length || 0}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow transition-colors">
              <h2 className="text-lg font-semibold mb-4 text-gt-primary dark:text-gt-primary">Top AI Picks</h2>
              <div className="space-y-4">
                {[
                  { city: "Paris", price: "$2004", img: "/paris.jpg" },
                  { city: "Tokyo", price: "$2506", img: "/tokyo.jpg" },
                  { city: "New York", price: "$4006", img: "/nyc.jpg" },
                ].map((trip, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-[#23211b] rounded overflow-hidden">
                      <Image
                        src={trip.img}
                        alt={trip.city}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gt-dark dark:text-gt-gray">{trip.city}</p>
                      <p className="text-sm text-[#66625B] dark:text-gt-gray">{trip.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
