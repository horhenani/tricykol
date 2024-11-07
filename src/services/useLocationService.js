import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { GOOGLE_MAPS_API_KEY } from "@config/keys";
import firestore from "@react-native-firebase/firestore";
import { LocationCacheService } from "./locationCacheService";

const useLocationService = () => {
  const [location, setLocation] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);

  // Use refs to track alert state between renders
  const hasShownInitialAlert = useRef(false);
  const previousLocationState = useRef(null);

  const getCurrentLocationWithAddress = async () => {
    try {
      // Use existing getCurrentLocation function
      const location = await getCurrentLocation();

      if (!location?.coords) {
        throw new Error("Could not get location coordinates");
      }

      // Get administrative areas for quick response
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_API_KEY}&language=en&region=PH&result_type=administrative_area_level_3|administrative_area_level_2`,
        {
          method: "GET",
          timeout: 2000,
        },
      );

      const data = await response.json();
      const results = data.results;

      if (results?.length > 0) {
        const components = results[0].address_components;

        const barangay = components.find((c) =>
          c.types.includes("administrative_area_level_3"),
        )?.long_name;
        const municipality = components.find((c) =>
          c.types.includes("administrative_area_level_2"),
        )?.long_name;

        return {
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
          name: barangay || municipality || "Current Location",
          address: [barangay, municipality, "Tarlac"]
            .filter(Boolean)
            .join(", "),
          components: {
            barangay,
            municipality,
          },
        };
      }

      // Fallback with coordinates
      return {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        name: "Current Location",
        address: "Tarlac Province",
        components: null,
      };
    } catch (error) {
      console.error("Error getting location with address:", error);
      return null;
    }
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result && result[0]) {
        // Format the address
        const location = result[0];
        const addressComponents = [];

        if (location.street) addressComponents.push(location.street);
        if (location.subregion) addressComponents.push(location.subregion);
        if (location.city) addressComponents.push(location.city);

        return {
          name: addressComponents[0] || "Current Location", // Use first component as name
          address: addressComponents.join(", "),
          fullLocation: location,
        };
      }
      return null;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return null;
    }
  };

  // Check if location services are enabled
  const checkLocationEnabled = useCallback(async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error("Error checking location status:", error);
      return false;
    }
  }, []);

  // Check location permission
  const checkLocationPermission = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const hasPermission = status === "granted";
      setHasLocationPermission(hasPermission);
      return hasPermission;
    } catch (error) {
      console.error("Error checking location permission:", error);
      return false;
    }
  }, []);

  // Initialize location monitoring
  const startLocationMonitoring = useCallback(async () => {
    try {
      if (locationWatcher) {
        locationWatcher.remove();
      }

      const enabled = await checkLocationEnabled();
      const hasPermission = await checkLocationPermission();

      if (!enabled || !hasPermission) {
        setLocation(null);
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (newLocation) => {
          setLocation(newLocation);
        },
      );

      setLocationWatcher(subscription);
    } catch (error) {
      console.error("Error starting location monitoring:", error);
    }
  }, [checkLocationEnabled, checkLocationPermission]);

  // Monitor location services status
  useEffect(() => {
    let statusCheck;
    let isMounted = true;

    const monitorLocationServices = async () => {
      try {
        // Initial check
        const enabled = await checkLocationEnabled();
        setIsLocationEnabled(enabled);
        previousLocationState.current = enabled;

        // Show initial alert if needed
        if (!enabled && !isFirstTimeUser && !hasShownInitialAlert.current) {
          setShowLocationAlert(true);
          hasShownInitialAlert.current = true;
        }

        if (enabled) {
          startLocationMonitoring();
        }

        // Set up monitoring interval
        statusCheck = setInterval(async () => {
          if (!isMounted) return;

          const currentEnabled = await checkLocationEnabled();

          // Only update state and show alert if there's an actual change
          if (currentEnabled !== previousLocationState.current) {
            setIsLocationEnabled(currentEnabled);

            // Show alert only when location is newly disabled
            if (!currentEnabled && !isFirstTimeUser) {
              setShowLocationAlert(true);
            }

            // Handle location state change
            if (!currentEnabled) {
              setLocation(null);
              if (locationWatcher) {
                locationWatcher.remove();
              }
            } else {
              startLocationMonitoring();
            }

            // Update previous state
            previousLocationState.current = currentEnabled;
          }
        }, 3000);
      } catch (error) {
        console.error("Error in location services monitor:", error);
      }
    };

    monitorLocationServices();

    return () => {
      isMounted = false;
      if (statusCheck) clearInterval(statusCheck);
      if (locationWatcher) locationWatcher.remove();
    };
  }, [isFirstTimeUser, startLocationMonitoring]);

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setHasLocationPermission(granted);
      if (granted) {
        startLocationMonitoring();
      }
      return granted;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

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

  // Get current location
  const getCurrentLocation = async () => {
    try {
      const enabled = await checkLocationEnabled();
      if (!enabled) {
        return null;
      }

      const hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        return null;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation(currentLocation);
      return currentLocation;
    } catch (error) {
      if (error?.code !== "E_LOCATION_SERVICES_DISABLED") {
        console.error("Error getting current location:", error);
      }
      return null;
    }
  };

  return {
    location,
    isLocationEnabled,
    hasLocationPermission,
    showLocationAlert,
    setShowLocationAlert,
    isFirstTimeUser,
    setIsFirstTimeUser,
    getCurrentLocation,
    checkLocationEnabled,
    checkLocationPermission,
    requestLocationPermission,
    openLocationSettings,
    startLocationMonitoring,
    reverseGeocode,
    getCurrentLocationWithAddress,
  };
};

export default useLocationService;
