import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
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
    showDisabledAlert,
    setShowDisabledAlert,
    getCurrentLocation,
    requestLocationPermission,
    openLocationSettings,
    isFirstTimeUser,
    setIsFirstTimeUser,
    checkFirstTimeUser,
  } = useLocationService();

  // Handle initial map setup and location
  useEffect(() => {
    const initializeMap = async () => {
      const currentLocation = await getCurrentLocation();
      if (currentLocation && mapRef.current) {
        mapRef.current.animateToLocation(currentLocation);
      }
    };

    initializeMap();
  }, []);

  useEffect(() => {
    const initializeUser = async () => {
      if (user?.uid) {
        await checkFirstTimeUser();
      } else {
        setIsFirstTimeUser(false);
      }
    };

    initializeUser();
  }, [user, checkFirstTimeUser]);

  const handleWelcomeDismiss = async () => {
    try {
      setIsFirstTimeUser(false);
      const permissionGranted = await requestLocationPermission();
      if (!permissionGranted) {
        setShowDisabledAlert(true);
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

  const handleBookPress = () => {
    // Check if location is enabled before showing booking modal
    if (!isLocationEnabled) {
      setShowDisabledAlert(true);
      return;
    }
    setIsBookingModalVisible(true);
  };

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
              />

              <BookingBottomSheet
                visible={isBookingModalVisible}
                onDismiss={() => setIsBookingModalVisible(false)}
                currentLocation={location}
              />

              <LocationDisabledAlert
                visible={showDisabledAlert}
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
