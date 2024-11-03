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
import BookingBottomSheet from "@components/bookings/BookingBottomSheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { LocationDisabledAlert } from "@components/location/LocationAlerts";
import { WelcomeLocationModal } from "../components/location/LocationAlerts";
import { useAuth } from "@context/AuthContext";

const Dashboard = () => {
  const mapRef = useRef(null);
  const [region, setRegion] = useState(null);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true); // Show for first-time users
  const { user } = useAuth();

  const {
    location,
    isLocationEnabled,
    hasLocationPermission,
    showDisabledAlert,
    setShowDisabledAlert,
    getCurrentLocation,
    requestLocationPermission,
    checkLocationPermission,
    checkLocationEnabled,
    openLocationSettings,
    isFirstTimeUser,
    setIsFirstTimeUser,
    checkFirstTimeUser,
  } = useLocationService();

  // Handle initial map setup and location
  useEffect(() => {
    const initializeUser = async () => {
      if (user?.uid) {
        // Always check first-time user status first
        await checkFirstTimeUser();

        // Always check location status, regardless of first-time user
        const isEnabled = await checkLocationEnabled();
        const hasPermission = await checkLocationPermission();

        // Only animate to location if we have permission and it's enabled
        // AND we're not showing the welcome modal
        if (isEnabled && hasPermission && !isFirstTimeUser) {
          const currentLocation = await getCurrentLocation();
          if (currentLocation && mapRef.current) {
            mapRef.current.animateToLocation(currentLocation);
          }
        }
      } else {
        setIsFirstTimeUser(false);
      }
    };

    initializeUser();
  }, [user]);

  const handleWelcomeDismiss = async () => {
    try {
      if (hasLocationPermission && isLocationEnabled) {
        setIsFirstTimeUser(false);
        const currentLocation = await getCurrentLocation();
        if (currentLocation && mapRef.current) {
          mapRef.current.animateToLocation(currentLocation);
        }
      }
    } catch (error) {
      console.error("Error handling welcome dismiss:", error);
      setIsFirstTimeUser(false);
    }
  };

  // Watch for location changes and update map
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToLocation(location);
    }
  }, [location]);

  // Watch for location services changes
  useEffect(() => {
    const checkLocation = async () => {
      if (isLocationEnabled) {
        const currentLocation = await getCurrentLocation();
        if (currentLocation && mapRef.current) {
          mapRef.current.animateToLocation(currentLocation);
        }
      }
    };

    checkLocation();
  }, [isLocationEnabled]);

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
  };

  // Location permission request handler
  const handleLocationPermissionRequest = async () => {
    try {
      const granted = await requestLocationPermission();
      if (granted) {
        await checkLocationPermission();
      }
      return granted;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  const handleBookPress = () => {
    // Check if location is enabled before showing booking modal
    if (!isLocationEnabled) {
      setShowDisabledAlert(true);
      return;
    }
    setIsBookingModalVisible(true);
  };

  useEffect(() => {
    const handleLocationEnabled = async () => {
      if (isLocationEnabled && hasLocationPermission && !isFirstTimeUser) {
        const currentLocation = await getCurrentLocation();
        if (currentLocation && mapRef.current) {
          mapRef.current.animateToLocation(currentLocation);
        }
      }
    };

    handleLocationEnabled();
  }, [isLocationEnabled, hasLocationPermission, isFirstTimeUser]);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaProvider>
          <StatusBar translucent backgroundColor="transparent" />
          <View style={styles.container}>
            <StyledMapView ref={mapRef} onRegionChange={handleRegionChange} />
            <DashboardHeader />
            <BookButton onPress={handleBookPress} />

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
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "padding"}
                // style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
              >
                <BookingBottomSheet
                  visible={isBookingModalVisible}
                  onDismiss={() => setIsBookingModalVisible(false)}
                  currentLocation={location}
                />
              </KeyboardAvoidingView>

              <LocationDisabledAlert
                visible={showDisabledAlert && !isFirstTimeUser}
                onDismiss={() => setShowDisabledAlert(false)}
              />
            </Portal>
          </View>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Dashboard;
