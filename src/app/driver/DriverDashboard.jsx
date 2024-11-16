// src/app/DriverDashboard.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Portal } from "react-native-paper";
import useLocationService from "@services/useLocationService";
import StyledMapView from "@components/map/StyledMapView";
import { useDriverAuth } from "@context/DriverAuthContext";
import CurrentLocationButton from "@components/map/CurrentLocationButton";
import DriverHeader from "@components/driver/DriverHeader";
import { LocationDisabledAlert } from "@components/location/LocationAlerts";
import { DriverWelcomeLocationModal } from "@components/location/LocationAlerts";
import firestore from "@react-native-firebase/firestore";
import AcceptedBookingCard from "@components/driver/AcceptedBookingCard";
import DriverBookingSheet from "@components/driver/DriverBookingSheet";
import { colors } from "@constants/globalStyles";
import DriverMapDirections from "@components/driver/DriverMapDirections";

const DriverDashboard = () => {
  const mapRef = useRef(null);

  const [isLocating, setIsLocating] = useState(false);
  const [driverStatus, setDriverStatus] = useState("offline");
  const { driver } = useDriverAuth();
  const [routeInfo, setRouteInfo] = useState(null);
  const [acceptedBooking, setAcceptedBooking] = useState(null);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);

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

  // Initialize dashboard and check first time user
  useEffect(() => {
    const initializeDashboard = async () => {
      if (driver?.uid) {
        try {
          // Get driver document
          const driverDoc = await firestore()
            .collection("drivers")
            .doc(driver.uid)
            .get();

          // Check if new driver
          const isNewDriver =
            !driverDoc.exists ||
            (driverDoc.exists && !driverDoc.data()?.hasSeenWelcome);

          // Set first time user state
          setIsFirstTimeUser(isNewDriver);

          // Only show location alert for existing drivers
          if (!isNewDriver && !isLocationEnabled) {
            setShowLocationAlert(true);
          }

          // Start location monitoring if permission exists
          if (hasLocationPermission) {
            startLocationMonitoring();
          }

          // Set driver's current status
          if (driverDoc.exists) {
            setDriverStatus(driverDoc.data().status || "offline");
          }
        } catch (error) {
          console.error("Error initializing driver dashboard:", error);
        }
      }
    };

    initializeDashboard();
  }, [driver]);

  useEffect(() => {
    if (!driver?.uid) return;

    // Subscribe to driver's current booking
    const unsubscribe = firestore()
      .collection("bookings")
      .where("driverId", "==", driver.uid)
      .where("status", "in", ["accepted", "arrived", "in_progress"])
      .limit(1)
      .onSnapshot(
        (snapshot) => {
          // Should only ever be one active booking
          const booking = snapshot.docs[0]?.data();
          if (booking) {
            setAcceptedBooking({
              id: snapshot.docs[0].id,
              ...booking,
            });
          } else {
            setAcceptedBooking(null);
          }
        },
        (error) => {
          console.error("Error subscribing to booking:", error);
        },
      );

    return () => unsubscribe();
  }, [driver?.uid]);

  const handleWelcomeDismiss = async () => {
    try {
      if (driver?.uid) {
        await firestore().collection("drivers").doc(driver.uid).update({
          hasSeenWelcome: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        setIsFirstTimeUser(false);
      }
    } catch (error) {
      console.error("Error handling welcome dismiss:", error);
    }
  };

  // Location permission request handler
  const handleLocationPermissionRequest = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";

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

  // Location button handler
  const handleLocationButtonPress = async () => {
    try {
      setIsLocating(true);

      // Quick check for location services
      if (!isLocationEnabled) {
        setShowLocationAlert(true);
        return;
      }

      // Quick check for permissions
      if (!hasLocationPermission) {
        const granted = await requestLocationPermission();
        if (!granted) {
          return;
        }
      }

      // Use existing location first for immediate response
      if (location?.coords) {
        mapRef.current?.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          300,
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

              // Update driver location if online
              if (driverStatus === "online" && driver?.uid) {
                firestore()
                  .collection("drivers")
                  .doc(driver.uid)
                  .update({
                    location: new firestore.GeoPoint(
                      freshLocation.coords.latitude,
                      freshLocation.coords.longitude,
                    ),
                    lastLocationUpdate: firestore.FieldValue.serverTimestamp(),
                  });
              }
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

          // Update driver location if online
          if (driverStatus === "online" && driver?.uid) {
            await firestore()
              .collection("drivers")
              .doc(driver.uid)
              .update({
                location: new firestore.GeoPoint(
                  currentLocation.coords.latitude,
                  currentLocation.coords.longitude,
                ),
                lastLocationUpdate: firestore.FieldValue.serverTimestamp(),
              });
          }
        }
      }
    } catch (error) {
      console.error("Error handling location press:", error);
    } finally {
      setIsLocating(false);
    }
  };

  // Handle driver status changes
  const handleStatusChange = async (newStatus) => {
    try {
      if (!driver?.uid) return;

      await firestore().collection("drivers").doc(driver.uid).update({
        status: newStatus,
        lastStatusUpdate: firestore.FieldValue.serverTimestamp(),
      });

      setDriverStatus(newStatus);

      // Update location immediately if going online
      if (newStatus === "online" && location?.coords) {
        await firestore()
          .collection("drivers")
          .doc(driver.uid)
          .update({
            location: new firestore.GeoPoint(
              location.coords.latitude,
              location.coords.longitude,
            ),
            lastLocationUpdate: firestore.FieldValue.serverTimestamp(),
          });
      }
    } catch (error) {
      console.error("Error updating driver status:", error);
    }
  };

  const handlePickupPress = async () => {
    setIsPickingUp(true);
    try {
      // Update booking status logic will be added later
      // This will integrate with the real-time location tracking
      setShowBookingSheet(false);
    } catch (error) {
      console.error("Error starting pickup:", error);
      showMessage({
        message: "Error",
        description: "Failed to start pickup. Please try again.",
        type: "error",
      });
    } finally {
      setIsPickingUp(false);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <StyledMapView
          ref={mapRef}
          showsUserLocation={false}
          followsUserLocation={driverStatus === "online"}
        >
          {acceptedBooking && location?.coords && (
            <DriverMapDirections
              driverLocation={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              booking={acceptedBooking}
              mapRef={mapRef}
              onRouteUpdate={(info) => setRouteInfo(info)}
            />
          )}
        </StyledMapView>

        <DriverHeader
          status={driverStatus}
          onStatusChange={handleStatusChange}
        />

        <CurrentLocationButton
          onPress={handleLocationButtonPress}
          loading={isLocating}
          style={styles.locationButton}
        />

        {acceptedBooking && (
          <>
            <AcceptedBookingCard
              booking={acceptedBooking}
              onPress={() => setShowBookingSheet(true)}
              routeInfo={routeInfo}
              style={styles.bookingCard}
            />
            <DriverBookingSheet
              visible={showBookingSheet}
              onDismiss={() => setShowBookingSheet(false)}
              booking={acceptedBooking}
              driverLocation={
                location?.coords
                  ? {
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }
                  : null
              }
            />
          </>
        )}

        <Portal>
          <DriverWelcomeLocationModal
            visible={isFirstTimeUser}
            onDismiss={handleWelcomeDismiss}
            userName={driver?.firstName}
            onRequestPermission={handleLocationPermissionRequest}
            onOpenSettings={openLocationSettings}
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
  locationButton: {
    right: 16,
    top: 160,
  },
});

export default DriverDashboard;
