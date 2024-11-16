// src/utils/markerImagePreload.js
import { Image } from "react-native";

// Define all marker images
export const MarkerImages = {
  TRICYCLE: require("@assets/markers/marker1.png"),
  PICKUP: require("@assets/markers/marker5.png"),
  DESTINATION: require("@assets/markers/marker4.png"),
};

// Preload all marker images
export const preloadMarkerImages = () => {
  const imageAssets = Object.values(MarkerImages).map((image) => {
    if (typeof image === "number") {
      // Handle require('./image.png') which returns a number
      return Image.prefetch(Image.resolveAssetSource(image).uri);
    }
    // Handle uri strings
    return Image.prefetch(image);
  });

  return Promise.all(imageAssets);
};

// Function to get correct size for different marker types
export const getMarkerSize = (type) => {
  switch (type) {
    case "TRICYCLE":
      return { width: 40, height: 40 };
    case "PICKUP":
      return { width: 35, height: 45 };
    case "DESTINATION":
      return { width: 35, height: 45 };
    default:
      return { width: 40, height: 40 };
  }
};
