// src/services/locationCacheService.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { GOOGLE_MAPS_API_KEY } from "@config/keys";

const CACHE_KEY = "LOCATION_CACHE";
const CACHE_EXPIRY = 1000 * 60 * 15; // 15 minutes

// Create coordinate memory cache
const coordinateCache = new Map();
const COORDINATE_CACHE_SIZE = 20;
const DISTANCE_THRESHOLD = 0.0001;

const geocodingApi = axios.create({
  baseURL: "https://maps.googleapis.com/maps/api/geocode",
  timeout: 2000, // timeout 2 seconds
});

// Memory cache for even faster access
let memoryCache = null;

const defaultLocation = () => ({
  name: "Selected Location",
  address: "Tarlac Province",
  components: {
    barangay: null,
    municipality: null,
  },
});

// Check if coordinates are close enough to use cached result
const areCoordinatesNearby = (coord1, coord2) => {
  return (
    Math.abs(coord1.latitude - coord2.latitude) < DISTANCE_THRESHOLD &&
    Math.abs(coord1.longitude - coord2.longitude) < DISTANCE_THRESHOLD
  );
};

// Check coordinate cache
const checkCoordinateCache = (latitude, longitude) => {
  for (let [key, value] of coordinateCache.entries()) {
    const [cachedLat, cachedLng] = key.split(",").map(Number);

    if (
      areCoordinatesNearby(
        { latitude, longitude },
        { latitude: cachedLat, longitude: cachedLng },
      )
    ) {
      return value;
    }
  }
  return null;
};

const getFallbackAddress = async (latitude, longitude) => {
  try {
    const response = await geocodingApi.get("/json", {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
        language: "en",
        region: "PH",
        // Only get administrative areas for faster response
        result_type: "administrative_area_level_3|administrative_area_level_2",
      },
      timeout: 2000, // Short timeout
    });

    const { results } = response.data;
    if (!results?.length) return defaultLocation();

    const components = results[0].address_components;

    // Get barangay (level 3) and municipality (level 2)
    const barangay = components.find((c) =>
      c.types.includes("administrative_area_level_3"),
    )?.long_name;
    const municipality = components.find((c) =>
      c.types.includes("administrative_area_level_2"),
    )?.long_name;

    if (!barangay && !municipality) return defaultLocation();

    // Format the location name and address
    const name = barangay || municipality;
    const address = [barangay, municipality, "Tarlac"]
      .filter(Boolean)
      .join(", ");

    return {
      name,
      address,
      components: {
        barangay,
        municipality,
      },
    };
  } catch (error) {
    console.error("Fallback geocoding error:", error);
    return defaultLocation();
  }
};

export const LocationCacheService = {
  // Get cached location with address
  getCache: async () => {
    try {
      // Check memory cache first
      if (
        memoryCache?.timestamp &&
        Date.now() - memoryCache.timestamp < CACHE_EXPIRY
      ) {
        return memoryCache.data;
      }

      // Check AsyncStorage
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          // Update memory cache
          memoryCache = { timestamp, data };
          return data;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting location cache:", error);
      return null;
    }
  },

  // Save location and address to cache
  setCache: async (locationData) => {
    try {
      const cacheData = {
        timestamp: Date.now(),
        data: locationData,
      };

      // Update memory cache
      memoryCache = cacheData;

      // Update AsyncStorage
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error("Error setting location cache:", error);
    }
  },

  // Get address from coordinates with optimized geocoding
  getAddressFromCoordinates: async (latitude, longitude) => {
    try {
      // First check coordinate cache
      const cachedResult = checkCoordinateCache(latitude, longitude);
      if (cachedResult) {
        console.log("Using cached coordinates result");
        return cachedResult;
      }

      // Quick attempt for detailed address
      const detailedResponse = await geocodingApi.get("/json", {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_MAPS_API_KEY,
          language: "en",
          region: "PH",
          result_type: "street_address|route|sublocality|locality",
        },
      });

      let locationData;

      if (detailedResponse?.data?.results?.length) {
        const result = detailedResponse.data.results[0];
        const components = result.address_components;

        const streetNumber = components.find((c) =>
          c.types.includes("street_number"),
        )?.long_name;
        const street = components.find((c) =>
          c.types.includes("route"),
        )?.long_name;
        const sublocality = components.find((c) =>
          c.types.includes("sublocality"),
        )?.long_name;
        const locality = components.find((c) =>
          c.types.includes("locality"),
        )?.long_name;

        locationData = {
          name:
            [streetNumber, street].filter(Boolean).join(" ") ||
            sublocality ||
            locality ||
            "Selected Location",
          address: result.formatted_address,
          placeId: result.place_id,
          components: {
            streetNumber,
            street,
            sublocality,
            locality,
            raw: components,
          },
        };
      } else {
        // Use administrative areas as fallback
        const fallbackResponse = await geocodingApi.get("/json", {
          params: {
            latlng: `${latitude},${longitude}`,
            key: GOOGLE_MAPS_API_KEY,
            language: "en",
            region: "PH",
            result_type:
              "administrative_area_level_3|administrative_area_level_2",
          },
        });

        if (fallbackResponse?.data?.results?.length) {
          const components =
            fallbackResponse.data.results[0].address_components;

          const barangay = components.find((c) =>
            c.types.includes("administrative_area_level_3"),
          )?.long_name;
          const municipality = components.find((c) =>
            c.types.includes("administrative_area_level_2"),
          )?.long_name;

          locationData = {
            name: barangay || municipality || "Selected Location",
            address: [barangay, municipality, "Tarlac"]
              .filter(Boolean)
              .join(", "),
            components: {
              barangay,
              municipality,
            },
          };
        } else {
          locationData = defaultLocation();
        }
      }

      // Cache the result
      const cacheKey = `${latitude},${longitude}`;
      coordinateCache.set(cacheKey, locationData);

      // Maintain cache size
      if (coordinateCache.size > COORDINATE_CACHE_SIZE) {
        const firstKey = coordinateCache.keys().next().value;
        coordinateCache.delete(firstKey);
      }

      return locationData;
    } catch (error) {
      console.error("Error in address lookup:", error);
      return defaultLocation();
    }
  },
};

//   // Clear cache
//   clearCache: async () => {
//     try {
//       memoryCache = null;
//       await AsyncStorage.removeItem(CACHE_KEY);
//     } catch (error) {
//       console.error("Error clearing location cache:", error);
//     }
//   },
// };
