// src/services/directionsService.js
import axios from "axios";
import { decode } from "@mapbox/polyline";
import { GOOGLE_MAPS_API_KEY } from "@config/keys";

// Add API key validation
const validateApiKey = () => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps API key is not configured");
  }
  return GOOGLE_MAPS_API_KEY;
};

// Update the axios instance
const directionsApi = axios.create({
  baseURL: "https://maps.googleapis.com/maps/api/directions",
  timeout: 10000,
  params: {
    key: validateApiKey(), // Add API key to default params
    mode: "driving",
    language: "en",
    region: "ph",
    units: "metric",
  },
});

export const DirectionsService = {
  getDirections: async (origin, destination) => {
    try {
      // Validate inputs
      if (
        !origin?.latitude ||
        !origin?.longitude ||
        !destination?.latitude ||
        !destination?.longitude
      ) {
        throw new Error("Invalid coordinates provided");
      }

      const response = await directionsApi.get("/json", {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
        },
      });

      if (response.data.status !== "OK") {
        throw new Error(`Directions API error: ${response.data.status}`);
      }

      const route = response.data.routes[0];
      if (!route) throw new Error("No route found");

      return {
        points: decode(route.overview_polyline.points).map(
          ([latitude, longitude]) => ({
            latitude,
            longitude,
          }),
        ),
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        fare: calculateFare(route.legs[0].distance.value),
      };
    } catch (error) {
      console.error("Directions API Error:", error);
      throw error;
    }
  },
};

// Calculate fare based on distance
const calculateFare = (distanceInMeters) => {
  try {
    const baseFare = 40; // PHP base fare
    const ratePerKm = 5; // PHP per kilometer after first kilometer
    const distanceInKm = distanceInMeters / 1000;
    const additionalKm = Math.max(0, distanceInKm - 1);
    const totalFare = Math.ceil(baseFare + additionalKm * ratePerKm);

    // Log fare calculation in development
    if (__DEV__) {
      console.log("Fare calculation:", {
        distanceKm: distanceInKm.toFixed(2),
        additionalKm: additionalKm.toFixed(2),
        totalFare,
      });
    }

    return totalFare;
  } catch (error) {
    console.error("Error calculating fare:", error);
    return 0; // Return 0 if calculation fails
  }
};

// Export additional utilities if needed
export const DirectionsUtilities = {
  isValidCoordinates,
  calculateFare,
};
