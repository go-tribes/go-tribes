"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export default function TripMap({
  departCoord,
  destinationCoord,
  departFrom,
  destination,
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],
  });

  const containerStyle = {
    width: "100%",
    height: "100%",
  };

  const center = destinationCoord || departCoord || { lat: 3.139, lng: 101.6869 }; // Default: KL

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
      {departCoord && (
        <Marker position={departCoord} label="Depart" title={departFrom} />
      )}
      {destinationCoord && (
        <Marker position={destinationCoord} label="Dest" title={destination} />
      )}
    </GoogleMap>
  );
}