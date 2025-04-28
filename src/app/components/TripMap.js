"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

export default function TripMap({ departCoord, destinationCoord, departFrom, destination }) {
  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    shadowSize: [41, 41],
  });

  return (
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
  );
}
