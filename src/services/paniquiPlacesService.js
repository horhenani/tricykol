// src/services/paniquiPlacesService.js

import firestore from "@react-native-firebase/firestore";
import { GOOGLE_MAPS_API_KEY } from "@env";

// Define Paniqui, Tarlac boundaries
const PANIQUI_BOUNDS = {
  northeast: {
    lat: 15.7253, // Northernmost point of Paniqui
    lng: 120.6314, // Easternmost point of Paniqui
  },
  southwest: {
    lat: 15.6026, // Southernmost point of Paniqui
    lng: 120.5314, // Westernmost point of Paniqui
  },
};

// Define place types we want to fetch
const PLACE_TYPES = [
  "establishment",
  "point_of_interest",
  "school",
  "hospital",
  "church",
  "store",
  "restaurant",
  "shopping_mall",
  "bank",
  "atm",
  "pharmacy",
  "supermarket",
  "police",
  "local_government_office",
  "gas_station",
];

export const fetchPaniquiPlaces = async () => {
  try {
    const places = [];
    const processedIds = new Set();

    // Convert bounds to string format for the API
    const bounds = `${PANIQUI_BOUNDS.southwest.lat},${PANIQUI_BOUNDS.southwest.lng}|${PANIQUI_BOUNDS.northeast.lat},${PANIQUI_BOUNDS.northeast.lng}`;

    // Fetch places for each type
    for (const type of PLACE_TYPES) {
      let pageToken = "";
      do {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=15.6626,120.5814&radius=3000&type=${type}&key=${GOOGLE_MAPS_API_KEY}${pageToken ? `&pagetoken=${pageToken}` : ""}&components=administrative_area:Paniqui|administrative_area:Tarlac`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === "OK") {
          // Filter and process places
          for (const place of data.results) {
            // Skip if we've already processed this place
            if (processedIds.has(place.place_id)) continue;

            // Verify place is within Paniqui bounds
            if (isWithinPaniquiBounds(place.geometry.location)) {
              const placeDetails = await fetchPlaceDetails(place.place_id);

              if (
                placeDetails &&
                placeDetails.formatted_address.includes("Paniqui")
              ) {
                places.push({
                  id: place.place_id,
                  name: place.name,
                  address: placeDetails.formatted_address,
                  coordinates: {
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                  },
                  category: place.types[0],
                  types: place.types,
                  rating: place.rating || 0,
                  isPopular: place.rating >= 4.0,
                  phoneNumber: placeDetails.formatted_phone_number || "",
                  photos: place.photos || [],
                  openingHours: placeDetails.opening_hours?.weekday_text || [],
                  searchKeywords: generateSearchKeywords(
                    place.name + " " + placeDetails.formatted_address,
                  ),
                });

                processedIds.add(place.place_id);
              }
            }
          }
          pageToken = data.next_page_token;
        } else {
          console.error("Error fetching places:", data.status);
          break;
        }

        // Wait a bit before making the next request if we have a page token
        if (pageToken) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } while (pageToken);
    }

    return places;
  } catch (error) {
    console.error("Error in fetchPaniquiPlaces:", error);
    throw error;
  }
};

// Helper function to check if a location is within Paniqui bounds
const isWithinPaniquiBounds = (location) => {
  return (
    location.lat >= PANIQUI_BOUNDS.southwest.lat &&
    location.lat <= PANIQUI_BOUNDS.northeast.lat &&
    location.lng >= PANIQUI_BOUNDS.southwest.lng &&
    location.lng <= PANIQUI_BOUNDS.northeast.lng
  );
};

// Fetch additional details for a place
const fetchPlaceDetails = async (placeId) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,formatted_phone_number,opening_hours&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};

// Save places to Firestore
export const savePaniquiPlacesToFirestore = async (places) => {
  try {
    const batch = firestore().batch();
    const placesRef = firestore().collection("paniqui_places");

    // Clear existing places first
    const existingDocs = await placesRef.get();
    existingDocs.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new places
    places.forEach((place) => {
      const docRef = placesRef.doc(place.id);
      batch.set(docRef, {
        ...place,
        metadata: {
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
      });
    });

    await batch.commit();
    console.log(
      `Successfully saved ${places.length} Paniqui places to Firestore`,
    );
  } catch (error) {
    console.error("Error saving places to Firestore:", error);
    throw error;
  }
};

// Generate search keywords for better search functionality
const generateSearchKeywords = (text) => {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "") // Remove special characters
    .split(/\s+/);

  const keywords = new Set();

  words.forEach((word) => {
    // Add full word
    keywords.add(word);

    // Add partial matches (for autocomplete)
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.substring(0, i));
    }
  });

  return Array.from(keywords);
};

// Search places in Firestore
export const searchPaniquiPlaces = async (searchText, limit = 10) => {
  try {
    const placesRef = firestore().collection("paniqui_places");

    // Create a query with multiple conditions
    const querySnapshot = await placesRef
      .where("searchKeywords", "array-contains", searchText.toLowerCase())
      .orderBy("name")
      .limit(limit)
      .get();

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error searching places:", error);
    throw error;
  }
};

// Get popular places
export const getPopularPaniquiPlaces = async (limit = 5) => {
  try {
    const snapshot = await firestore()
      .collection("paniqui_places")
      .where("isPopular", "==", true)
      .orderBy("rating", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching popular places:", error);
    throw error;
  }
};
