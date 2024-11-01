import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { useAuth } from "@context/AuthContext";
import firestore from "@react-native-firebase/firestore";

const useLocationService = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [showPostRegAlert, setShowPostRegAlert] = useState(false);
  const [showDisabledAlert, setShowDisabledAlert] = useState(false);
  const { user } = useAuth();
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // In useLocationService.js
  const checkFirstTimeUser = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userDoc = await firestore().collection("users").doc(user.uid).get();

      if (!userDoc.exists) {
        // This shouldn't happen as user doc is created during registration
        setIsFirstTimeUser(false);
        return;
      }

      const userData = userDoc.data();

      // Check if this is their first visit to dashboard
      if (!userData?.hasSeenWelcome) {
        // Update the flag in Firestore
        await firestore().collection("users").doc(user.uid).update({
          hasSeenWelcome: true,
          lastLogin: firestore.FieldValue.serverTimestamp(),
        });
        setIsFirstTimeUser(true);
      } else {
        setIsFirstTimeUser(false);
      }
    } catch (error) {
      console.error("Error checking first time user:", error);
      setIsFirstTimeUser(false);
    }
  }, [user]);

  // Check if location services are enabled
  const checkLocationEnabled = useCallback(async () => {
    const enabled = await Location.hasServicesEnabledAsync();
    setIsLocationEnabled(enabled);

    // Show disabled alert if user is logged in and location is disabled
    if (user && !enabled) {
      setShowDisabledAlert(true);
    }

    return enabled;
  }, [user]);

  // Watch for location service changes
  useEffect(() => {
    let isMounted = true;
    let checkInterval;

    const watchLocationService = async () => {
      if (!isMounted) return;

      const enabled = await Location.hasServicesEnabledAsync();

      // Only update state if enabled status has changed
      if (enabled !== isLocationEnabled) {
        setIsLocationEnabled(enabled);

        // If location was just enabled
        if (enabled) {
          const permissionStatus =
            await Location.getForegroundPermissionsAsync();
          if (permissionStatus.status === "granted") {
            const currentLocation = await getCurrentLocation();
            if (currentLocation) {
              await watchLocation();
            }
          }
        }
      }
    };

    // Start watching location service status
    checkInterval = setInterval(watchLocationService, 1000);

    // Initial check
    watchLocationService();

    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [isLocationEnabled]);

  // Open location settings
  const openLocationSettings = useCallback(async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    } else {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS,
      );
    }
  }, []);

  // Request location permission
  // Modify requestLocationPermission
  const requestLocationPermission = useCallback(async () => {
    try {
      // First check if permission is already granted
      const { status: existingStatus } =
        await Location.getForegroundPermissionsAsync();
      if (existingStatus === "granted") return true;

      // If not granted, request it
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  }, []);

  // Should check permissions first and ensure modal shows:
  const handlePostRegistrationLocation = useCallback(async () => {
    setShowPostRegAlert(true);
  }, []);

  // Handle the okay button press from post-registration modal
  // Update handlePostRegModalDismiss
  const handlePostRegModalDismiss = useCallback(async () => {
    try {
      setShowPostRegAlert(false); // Hide modal
      // Immediately request permission after modal is dismissed
      const result = await requestLocationPermission();

      if (result) {
        // If permission granted, try to get current location
        await getCurrentLocation();
      }
      return result;
    } catch (error) {
      console.error("Error in modal dismiss handler:", error);
      return false;
    }
  }, [requestLocationPermission, getCurrentLocation]);

  // Get current location with high accuracy
  const getCurrentLocation = useCallback(async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setShowDisabledAlert(true);
        return null;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        return null;
      }

      // Use low accuracy for faster initial response
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Changed from High to Balanced
        maximumAge: 5000, // Reduced from 10000 to 5000
        timeout: 5000, // Add timeout
      });

      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      console.error("Error getting location:", error);
      setErrorMsg("Could not get current location");
      return null;
    }
  }, [checkLocationEnabled]);

  // Modify watchLocation to handle reconnection
  const watchLocation = useCallback(async () => {
    try {
      const enabled = await checkLocationEnabled();
      const { status } = await Location.getForegroundPermissionsAsync();

      if (!enabled || status !== "granted") {
        return null;
      }

      // Start watching location with more frequent updates
      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // More frequent updates
          distanceInterval: 5, // Smaller distance interval
        },
        (newLocation) => {
          setLocation(newLocation);
        },
      );
    } catch (error) {
      console.error("Error watching location:", error);
      return null;
    }
  }, [checkLocationEnabled]);

  // Check location status when user changes
  useEffect(() => {
    if (user) {
      checkLocationEnabled();
    }
  }, [user, checkLocationEnabled]);

  // Initialize location services on mount
  useEffect(() => {
    let locationSubscription = null;

    const initLocation = async () => {
      if (user) {
        const enabled = await checkLocationEnabled();
        if (enabled) {
          const permissionStatus =
            await Location.getForegroundPermissionsAsync();
          if (permissionStatus.status === "granted") {
            const currentLocation = await getCurrentLocation();
            if (currentLocation) {
              locationSubscription = await watchLocation();
            }
          }
        }
      }
    };

    initLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [user]);

  return {
    location,
    errorMsg,
    isLocationEnabled,
    showPostRegAlert,
    showDisabledAlert,
    getCurrentLocation,
    checkLocationEnabled,
    handlePostRegistrationLocation,
    handlePostRegModalDismiss,
    setShowPostRegAlert,
    setShowDisabledAlert,
    openLocationSettings, // Make sure to include this
    requestLocationPermission,
    checkFirstTimeUser,
    isFirstTimeUser,
    setIsFirstTimeUser,
  };
};

export default useLocationService;
