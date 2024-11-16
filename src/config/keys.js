// src/config/keys.js
import Constants from "expo-constants";

export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
// export const GOOGLE_MAPS_API_KEY = "AIzaSyDAbbCdjchqehJ_A5KD1-_0M2GSiaieD78";

// const config = {
//   // Use different keys for Android and iOS
//   GOOGLE_MAPS_API_KEY: Platform.select({
//     ios: Constants.expoConfig?.ios?.config?.googleMapsApiKey || 'YOUR_IOS_API_KEY',
//     android: Constants.expoConfig?.android?.config?.googleMaps?.apiKey || 'YOUR_ANDROID_API_KEY',
//   }),
//   // Other config keys...
// };

if (!GOOGLE_MAPS_API_KEY) {
  console.warn("Google Maps API key not found in app config");
}
