// scripts/populatePaniquiPlaces.js
import admin from "firebase-admin";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize dotenv
dotenv.config();

// Validate environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!GOOGLE_MAPS_API_KEY) {
  console.error("Error: GOOGLE_MAPS_API_KEY is not set in .env file");
  process.exit(1);
}

// Initialize Firebase Admin
try {
  // Read service account file using ES modules approach
  const serviceAccountPath = new URL(
    "../service-account.json",
    import.meta.url,
  );
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error("Error initializing Firebase Admin:", error);
  console.log(
    "\nPlease ensure you have a valid service-account.json file in your project root.",
  );
  console.log(
    "You can generate one from Firebase Console > Project Settings > Service Accounts",
  );
  process.exit(1);
}

const db = admin.firestore();

// Paniqui geographical boundaries
const PANIQUI_BOUNDS = {
  northeast: {
    lat: 15.7253,
    lng: 120.6314,
  },
  southwest: {
    lat: 15.6026,
    lng: 120.5314,
  },
  center: {
    lat: 15.6626,
    lng: 120.5814,
  },
};

// Place types to fetch
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
  "bus_station",
  "parking",
  "convenience_store",
  "grocery_or_supermarket",
];

// Helper function to check if location is within Paniqui bounds
const isWithinPaniquiBounds = (location) => {
  return (
    location.lat >= PANIQUI_BOUNDS.southwest.lat &&
    location.lat <= PANIQUI_BOUNDS.northeast.lat &&
    location.lng >= PANIQUI_BOUNDS.southwest.lng &&
    location.lng <= PANIQUI_BOUNDS.northeast.lng
  );
};

// Generate search keywords for better search functionality
const generateSearchKeywords = (text) => {
  if (!text) return [];

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .split(/\s+/);

  const keywords = new Set();

  words.forEach((word) => {
    // Add full word
    keywords.add(word);

    // Add partial matches for autocomplete
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.substring(0, i));
    }
  });

  return Array.from(keywords);
};

// Fetch place details from Google Places API
const fetchPlaceDetails = async (placeId) => {
  try {
    const fields = [
      "formatted_address",
      "formatted_phone_number",
      "opening_hours",
      "website",
      "rating",
      "user_ratings_total",
      "price_level",
    ].join(",");

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      return data.result;
    }

    console.warn(
      `Warning: Could not fetch details for place ${placeId}:`,
      data.status,
    );
    return null;
  } catch (error) {
    console.error("Error fetching place details:", error);
    return null;
  }
};

// Main function to fetch Paniqui places
const fetchPaniquiPlaces = async () => {
  try {
    const places = [];
    const processedIds = new Set();
    let totalProcessed = 0;

    for (const type of PLACE_TYPES) {
      console.log(`\nFetching places of type: ${type}`);
      let pageToken = "";
      let retryCount = 0;
      const maxRetries = 3;

      do {
        try {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${PANIQUI_BOUNDS.center.lat},${PANIQUI_BOUNDS.center.lng}&radius=3000&type=${type}&key=${GOOGLE_MAPS_API_KEY}${pageToken ? `&pagetoken=${pageToken}` : ""}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.status === "OK") {
            for (const place of data.results) {
              if (processedIds.has(place.place_id)) {
                continue;
              }

              if (isWithinPaniquiBounds(place.geometry.location)) {
                const placeDetails = await fetchPlaceDetails(place.place_id);

                if (placeDetails?.formatted_address?.includes("Paniqui")) {
                  const placeData = {
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
                    website: placeDetails.website || "",
                    openingHours:
                      placeDetails.opening_hours?.weekday_text || [],
                    priceLevel: placeDetails.price_level || 0,
                    userRatingsTotal: placeDetails.user_ratings_total || 0,
                    searchKeywords: generateSearchKeywords(
                      `${place.name} ${placeDetails.formatted_address} ${place.types.join(" ")}`,
                    ),
                    metadata: {
                      createdAt: admin.firestore.FieldValue.serverTimestamp(),
                      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                      lastVerified:
                        admin.firestore.FieldValue.serverTimestamp(),
                    },
                  };

                  places.push(placeData);
                  processedIds.add(place.place_id);
                  totalProcessed++;

                  console.log(`[${totalProcessed}] Added: ${place.name}`);
                }
              }
            }

            pageToken = data.next_page_token;
            retryCount = 0;

            if (pageToken) {
              console.log("Waiting for next page...");
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          } else {
            console.error(`Error fetching places: ${data.status}`);
            if (++retryCount >= maxRetries) break;
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * retryCount),
            );
          }
        } catch (error) {
          console.error(`Error processing ${type}:`, error);
          if (++retryCount >= maxRetries) break;
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * retryCount),
          );
        }
      } while (pageToken);
    }

    return places;
  } catch (error) {
    console.error("Error in fetchPaniquiPlaces:", error);
    throw error;
  }
};

// Save places to Firestore
const savePaniquiPlacesToFirestore = async (places) => {
  try {
    const placesRef = db.collection("paniqui_places");

    // Delete existing documents
    console.log("\nDeleting existing places...");
    const existingDocs = await placesRef.get();
    const deleteCount = existingDocs.size;

    // Use batched writes for better performance
    const deleteBatch = db.batch();
    existingDocs.docs.forEach((doc) => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log(`Deleted ${deleteCount} existing places`);

    // Add new places in batches of 500 (Firestore limit)
    console.log("\nSaving new places...");
    const batchSize = 500;
    for (let i = 0; i < places.length; i += batchSize) {
      const batch = db.batch();
      const chunk = places.slice(i, i + batchSize);

      chunk.forEach((place) => {
        const docRef = placesRef.doc(place.id);
        batch.set(docRef, place);
      });

      await batch.commit();
      console.log(`Saved places ${i + 1} to ${i + chunk.length}`);
    }

    console.log(
      `\nSuccessfully saved ${places.length} Paniqui places to Firestore`,
    );
  } catch (error) {
    console.error("Error saving places to Firestore:", error);
    throw error;
  }
};

// Main execution
const populatePaniquiPlaces = async () => {
  try {
    console.log("Starting to fetch places for Paniqui, Tarlac...\n");
    const startTime = Date.now();

    const places = await fetchPaniquiPlaces();
    console.log(`\nFound ${places.length} places.`);

    await savePaniquiPlacesToFirestore(places);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    console.log(
      `\nScript completed successfully in ${duration.toFixed(1)} seconds`,
    );

    process.exit(0);
  } catch (error) {
    console.error("\nFatal error:", error);
    process.exit(1);
  }
};

// Run the script
populatePaniquiPlaces();
