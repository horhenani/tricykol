// src/config/keys.js
import Constants from 'expo-constants';

export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;

if (!GOOGLE_MAPS_API_KEY) {
  console.warn('Google Maps API key not found in app config');
}
