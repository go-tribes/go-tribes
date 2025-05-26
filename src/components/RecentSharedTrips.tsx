"use client";

import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function RecentSharedTrips() {
  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrips = async () => {
      const q = query(collection(db, "trips"), orderBy("createdAt", "desc"), limit(5));
      const snapshot = await getDocs(q);
      setTrips(snapshot.docs.map((doc) => doc.data()));
    };
    fetchTrips();
  }, []);

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-semibold mb-4">Recent Shared Trips by Tribes</h2>
      {trips.length === 0 ? (
        <p className="text-sm text-gray-500">No trips shared yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {trips.map((trip, idx) => (
            <div key={idx} className="p-4 border rounded hover:bg-[#f9f9f9]">
              <div className="font-bold">{trip.title}</div>
              <div className="text-sm text-gray-600">
                {trip.userName || "Unknown"} &bull; {trip.destination} &bull; {trip.days} days
              </div>
              {trip.interests?.length > 0 && (
                <div className="text-xs text-[#66625B]">
                  Interests: {trip.interests.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
