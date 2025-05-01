"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

type TripMapProps = {
  departCoord: { lat: number; lng: number } | null;
  destinationCoord: { lat: number; lng: number } | null;
  departFrom: string;
  destination: string;
};

export default function TripMap({
  departCoord,
  destinationCoord,
  departFrom,
  destination,
}: TripMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  // ✅ Important: use fixed height and width to prevent rendering issues
  const containerStyle = {
    width: "100%",
    height: "100%", // Let parent container control height
  };

  const center = destinationCoord || departCoord || { lat: 3.139, lng: 101.6869 }; // Default to KL

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
    >
      {departCoord && (
        <Marker
          position={departCoord}
          label="Depart"
          title={departFrom}
        />
      )}
      {destinationCoord && (
        <Marker
          position={destinationCoord}
          label="Dest"
          title={destination}
        />
      )}
    </GoogleMap>
  );
}
