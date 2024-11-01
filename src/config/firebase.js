import { initializeApp } from "@react-native-firebase/app";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

let app;

try {
  // Initialize Firebase - no need for config object as it's in google-services.json
  app = initializeApp();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

// Helper function to get current auth instance
export const getAuth = () => auth();

// Helper function to get firestore instance
export const getFirestore = () => firestore();

export default app;
