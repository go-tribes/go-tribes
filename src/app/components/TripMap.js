"use client";

import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

export default function TripMap({ departCoord, destinationCoord, departFrom, destination }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "YOUR_GOOGLE_API_KEY",
    libraries: ["places"],
  });

  const center = destinationCoord || departCoord || { lat: 3.139, lng: 101.6869 }; // Default to KL center
  const containerStyle = {
    width: "100%",
    height: "100%",
  };

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={10}
    >
      {departCoord && (
        <Marker position={departCoord} label="Depart" />
      )}
      {destinationCoord && (
        <Marker position={destinationCoord} label="Destination" />
      )}
    </GoogleMap>
  );
}
