import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Portal } from "react-native-paper";
import useLocationService from "@services/useLocationService";
import DashboardHeader from "@components/DashboardHeader";
import StyledMapView from "@components/map/StyledMapView";
import BookButton from "@components/bookings/BookButton";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LocationDisabledAlert } from "@components/location/LocationAlerts";
import { WelcomeLocationModal } from "../components/location/LocationAlerts";
import { useAuth } from "@context/AuthContext";
import CurrentLocationButton from "@components/map/CurrentLocationButton";
import firestore from "@react-native-firebase/firestore";
import * as Location from "expo-location";

import {
  TricycleMarker,
  LocationMarker,
} from "@components/map/markers/customMarkers";
import { preloadMarkerImages } from "@utils/markerImagePreload";
import DraggableLocationMarker from "@components/map/markers/DraggableLocationMarker";
import MapViewDirectionsCustom, {
  RouteInfo,
} from "@components/map/directions/MapViewDirectionsCustom";

const Dashboard = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { user } = useAuth();

  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [markersLoaded, setMarkersLoaded] = useState(false);

  const {
    location,
    isLocationEnabled,
    hasLocationPermission,
    showLocationAlert,
    setShowLocationAlert,
    isFirstTimeUser,
    setIsFirstTimeUser,
    getCurrentLocation,
    requestLocationPermission,
    openLocationSettings,
    startLocationMonitoring,
    checkLocationPermission,
  } = useLocationService();

  // Preload marker images when component mounts
  useEffect(() => {
    const loadMarkers = async () => {
      try {
        await preloadMarkerImages();
        setMarkersLoaded(true);
      } catch (error) {
        console.error("Error preloading markers:", error);
        // Still set to true to not block the UI
        setMarkersLoaded(true);
      }
    };

    loadMarkers();
  }, []);

  // Set initial pickup location when user location is available
  useEffect(() => {
    if (location?.coords && !pickupLocation) {
      setPickupLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  }, [location]);

  // Handle booking flow
  const handleBookingLocationSelect = (type, selectedLocation) => {
    if (type === "pickup") {
      setPickupLocation(selectedLocation);
    } else {
      setDestinationLocation(selectedLocation);
    }
  };

  // Handle initial map setup and location
  useEffect(() => {
    const initializeDashboard = async () => {
      if (user?.uid) {
        try {
          // Get user document
          const userDoc = await firestore()
            .collection("users")
            .doc(user.uid)
            .get();

          // Modified logic to correctly identify new users
          const isNewUser =
            !userDoc.exists ||
            (userDoc.exists && !userDoc.data()?.hasSeenWelcome);

          // Always set first time user state for new users
          setIsFirstTimeUser(isNewUser);

          // Only show location alert for existing users
          if (!isNewUser && !isLocationEnabled) {
            setShowLocationAlert(true);
          }

          // Start location monitoring if permission exists
          if (hasLocationPermission) {
            startLocationMonitoring();
          }
        } catch (error) {
          console.error("Error initializing dashboard:", error);
        }
      }
    };

    initializeDashboard();
  }, [user]);

  const handleWelcomeDismiss = async () => {
    try {
      if (user?.uid) {
        // Update Firestore
        await firestore().collection("users").doc(user.uid).update({
          hasSeenWelcome: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        // Update local state
        setIsFirstTimeUser(false);
      }
    } catch (error) {
      console.error("Error handling welcome dismiss:", error);
    }
  };

  // Watch for location changes and update map

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
  };

  // Location permission request handler
  const handleLocationPermissionRequest = async () => {
    try {
      // Directly call the location permission request
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";

      // If permission granted, start location services
      if (granted) {
        await checkLocationPermission();
        if (isLocationEnabled) {
          await startLocationMonitoring();
        }
      }

      return granted;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  // Location settings handler
  const handleOpenLocationSettings = async () => {
    try {
      await openLocationSettings();
      // Note: We don't need to check immediately as the useEffect interval will handle it
    } catch (error) {
      console.error("Error opening location settings:", error);
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isBookingModalVisible) {
          setIsBookingModalVisible(false);
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [isBookingModalVisible]);

  const handleLocationButtonPress = async () => {
    try {
      setIsLocating(true);

      // Quick check for location services
      if (!isLocationEnabled) {
        setShowLocationAlert(true);
        setIsLocating(false);
        return;
      }

      // Quick check for permissions
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          setIsLocating(false);
          return;
        }
      }

      // Use existing location first for immediate response
      if (location?.coords) {
        mapRef.current?.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005, // Closer zoom level
            longitudeDelta: 0.005,
          },
          300, // Quicker animation
        );

        // Then get fresh location in background
        getCurrentLocation()
          .then((freshLocation) => {
            if (freshLocation?.coords && mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: freshLocation.coords.latitude,
                  longitude: freshLocation.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                },
                200,
              );
            }
          })
          .catch((error) => {
            console.error("Error getting fresh location:", error);
          });
      } else {
        // If no existing location, wait for fresh location
        const currentLocation = await getCurrentLocation();
        if (currentLocation?.coords && mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            300,
          );
        }
      }
    } catch (error) {
      console.error("Error handling location button press:", error);
    } finally {
      setIsLocating(false);
    }
  };

  const handleLocationSelect = (type, location) => {
    if (type === "pickup") {
      setPickupLocation(location);
      // If needed, animate map to show pickup location
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
      }
    } else {
      setDropoffLocation(location);
      // If needed, animate map to show destination
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
      }
    }
  };

  useEffect(() => {
    if (route.params?.selectedPickup && route.params?.selectedDropoff) {
      const { selectedPickup, selectedDropoff } = route.params;

      setPickupLocation(selectedPickup);
      setDropoffLocation(selectedDropoff);

      // Reset the route params to avoid re-rendering
      navigation.setParams({
        selectedPickup: undefined,
        selectedDropoff: undefined,
        showRoute: undefined,
      });

      // Slight delay to ensure markers are placed before fitting
      setTimeout(() => {
        if (mapRef.current) {
          const coordinates = [
            {
              latitude: selectedPickup.latitude,
              longitude: selectedPickup.longitude,
            },
            {
              latitude: selectedDropoff.latitude,
              longitude: selectedDropoff.longitude,
            },
          ];

          mapRef.current.fitToCoordinates(coordinates, {
            edgePadding: {
              top: 100,
              right: 50,
              bottom: 100,
              left: 50,
            },
            animated: true,
          });
        }
      }, 500);
    }
  }, [route.params]);

  const handleRouteInfoUpdate = (info, error) => {
    if (error) {
      setRouteError(error);
      setRouteInfo(null);
      return;
    }
    setRouteInfo(info);
    setRouteError(null);
  };

  const handleBookPress = () => {
    if (!isLocationEnabled) {
      setShowLocationAlert(true);
      return;
    }

    // Navigate to booking screen with initial locations if available
    navigation.navigate("Booking", {
      pickupLocation: pickupLocation
        ? {
            latitude: pickupLocation.latitude,
            longitude: pickupLocation.longitude,
            title: pickupLocation.title || "",
            description: pickupLocation.description,
          }
        : null,
      dropoffLocation: dropoffLocation
        ? {
            latitude: dropoffLocation.latitude,
            longitude: dropoffLocation.longitude,
            title: dropoffLocation.title,
            description: dropoffLocation.description,
          }
        : null,
      routeInfo: routeInfo,
    });
  };

  return (
      <SafeAreaProvider>
        <StatusBar translucent backgroundColor="transparent" />
        <View style={styles.container}>
          <StyledMapView ref={mapRef} onRegionChange={handleRegionChange}>
            {markersLoaded && (
              <>
                {/* Directions */}
                {pickupLocation && dropoffLocation && (
                  <MapViewDirectionsCustom
                    origin={pickupLocation}
                    destination={dropoffLocation}
                    mapRef={mapRef}
                    onRouteInfoUpdate={handleRouteInfoUpdate}
                  />
                )}

                {/* Markers */}
                {pickupLocation && (
                  <LocationMarker
                    coordinate={pickupLocation}
                    type="pickup"
                    identifier="pickup"
                    title={pickupLocation.title}
                    description={pickupLocation.description}
                  />
                )}

                {dropoffLocation && (
                  <LocationMarker
                    coordinate={dropoffLocation}
                    type="destination"
                    identifier="dropoff"
                    title={dropoffLocation.title}
                    description={dropoffLocation.description}
                  />
                )}
              </>
            )}

            {destinationLocation && (
              <DraggableLocationMarker
                coordinate={destinationLocation}
                onDragEnd={handleDestinationDragEnd}
                identifier="destination"
                title={destinationLocation.title}
                description={destinationLocation.description}
              />
            )}
          </StyledMapView>

          <DashboardHeader />

          {routeInfo && !routeError && <RouteInfo routeInfo={routeInfo} />}

          <CurrentLocationButton
            onPress={handleLocationButtonPress}
            loading={isLocating}
          />
          <BookButton
            onPress={handleBookPress}
            // disabled={!isLocationEnabled}
            pickup={pickupLocation}
            dropoff={dropoffLocation}
            routeInfo={routeInfo}
          />

          <Portal>
            <WelcomeLocationModal
              visible={isFirstTimeUser}
              onDismiss={handleWelcomeDismiss}
              userName={user?.firstName}
              onRequestPermission={handleLocationPermissionRequest}
              onOpenSettings={handleOpenLocationSettings}
              isLocationEnabled={isLocationEnabled}
              hasLocationPermission={hasLocationPermission}
            />

            <LocationDisabledAlert
              visible={showLocationAlert && !isFirstTimeUser}
              onDismiss={() => setShowLocationAlert(false)}
            />
          </Portal>
        </View>
      </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Dashboard;
