// src/utils/mapUtils.js
import { decode } from "@mapbox/polyline";
import { GOOGLE_MAPS_API_KEY } from "@env";

export const decodeDirectionsToCoordinates = (directions) => {
  if (!directions?.routes?.[0]) return [];

  const route = directions.routes[0];
  const polyline = route.overview_polyline.points;

  return decode(polyline).map(([latitude, longitude]) => ({
    latitude,
    longitude,
  }));
};

export const fetchDirections = async (origin, destination) => {
  if (!origin || !destination)
    throw new Error("Origin and destination required");

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(data.error_message || "Directions request failed");
    }

    return data;
  } catch (error) {
    console.error("Error fetching directions:", error);
    throw error;
  }
};

export const getRegionForCoordinates = (points, padding = 1.2) => {
  if (!points?.length) return null;

  let minLat = Math.min(...points.map((p) => p.latitude));
  let maxLat = Math.max(...points.map((p) => p.latitude));
  let minLng = Math.min(...points.map((p) => p.longitude));
  let maxLng = Math.max(...points.map((p) => p.longitude));

  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const deltaLat = (maxLat - minLat) * padding;
  const deltaLng = (maxLng - minLng) * padding;

  return {
    latitude: midLat,
    longitude: midLng,
    latitudeDelta: Math.max(deltaLat, 0.02),
    longitudeDelta: Math.max(deltaLng, 0.02),
  };
};

export const calculateMarkerRotation = (prevCoord, nextCoord) => {
  if (!prevCoord || !nextCoord) return 0;

  const dx = nextCoord.longitude - prevCoord.longitude;
  const dy = nextCoord.latitude - prevCoord.latitude;

  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

export const isValidCoordinate = (coord) => {
  return (
    coord &&
    typeof coord.latitude === "number" &&
    typeof coord.longitude === "number" &&
    coord.latitude >= -90 &&
    coord.latitude <= 90 &&
    coord.longitude >= -180 &&
    coord.longitude <= 180
  );
};

// Helper to fit map to show all markers and route
export const fitMapToCoordinates = (mapRef, coordinates, edgePadding = {}) => {
  if (!mapRef?.current || !coordinates?.length) return;

  const padding = {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
    ...edgePadding,
  };

  mapRef.current.fitToCoordinates(coordinates, {
    edgePadding: padding,
    animated: true,
  });
};
