import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  ActivityIndicator,
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
import colors from "@constants/globalStyles";
import { BookingService } from "@services/bookingService";
import ActiveBookingCard from "@components/bookings/ActiveBookingCard";
import TripCompletionModal from "@components/bookings/TripCompletionModal";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import ConnectionStatusBar from "@components/ConnectionStatusBar";
import { GOOGLE_MAPS_API_KEY } from "@config/keys";

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
  // const [imagesLoaded, setImagesLoaded] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);
  // const bookingSubscription = useRef(null);
  // const [isBookingCardCollapsed, setIsBookingCardCollapsed] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedTripDetails, setCompletedTripDetails] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  const { user } = useAuth();
  const { isConnectionStable } = useNetworkStatus();
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

  const mapContent = useMemo(() => {
    if (!markersLoaded || isLoadingMap) return null;

    return (
      <>
        {pickupLocation && dropoffLocation && (
          <MapViewDirectionsCustom
            origin={pickupLocation}
            destination={dropoffLocation}
            mapRef={mapRef}
            onRouteInfoUpdate={handleRouteInfoUpdate}
            strokeColor={activeBooking ? colors.primary : undefined}
            strokeWidth={activeBooking ? 4 : undefined}
          />
        )}
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
    );
  }, [
    markersLoaded,
    isLoadingMap,
    pickupLocation,
    dropoffLocation,
    activeBooking,
    handleRouteInfoUpdate,
  ]);

  useEffect(() => {
    let mounted = true;

    const initializeDashboard = async () => {
      try {
        if (user?.uid) {
          const userDoc = await firestore()
            .collection("users")
            .doc(user.uid)
            .get();

          if (!mounted) return;

          const isNewUser =
            !userDoc.exists ||
            (userDoc.exists && !userDoc.data()?.hasSeenWelcome);

          setIsFirstTimeUser(isNewUser);

          if (!isNewUser && !isLocationEnabled) {
            setShowLocationAlert(true);
          }

          // Start location monitoring if permission exists
          if (hasLocationPermission) {
            await startLocationMonitoring();
          }
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initializeDashboard();
    return () => {
      mounted = false;
    };
  }, [user, hasLocationPermission, isLocationEnabled, startLocationMonitoring]);

  useEffect(() => {
    if (hasLocationPermission && isLocationEnabled && !isInitializing) {
      startLocationMonitoring();
    }
  }, [hasLocationPermission, isLocationEnabled, isInitializing]);

  useEffect(() => {
    if (route.params?.booking) {
      const { booking } = route.params;

      // Set booking states
      setActiveBooking(booking);
      setPickupLocation({
        latitude: booking.pickup.latitude,
        longitude: booking.pickup.longitude,
        title: booking.pickup.address,
        description: booking.pickup.description,
      });
      setDropoffLocation({
        latitude: booking.dropoff.latitude,
        longitude: booking.dropoff.longitude,
        title: booking.dropoff.address,
        description: booking.dropoff.description,
      });

      // Set route info
      if (booking.route) {
        setRouteInfo(booking.route);

        // Fit map to show route
        if (mapRef.current && booking.route.coordinates) {
          setTimeout(() => {
            mapRef.current.fitToCoordinates(booking.route.coordinates, {
              edgePadding: {
                top: 100,
                right: 50,
                bottom: 100,
                left: 50,
              },
              animated: true,
            });
          }, 1000);
        }
      }

      // Clear navigation params
      navigation.setParams({ booking: undefined });
    }
  }, [route.params?.booking]);

  // Load active booking on mount
  useEffect(() => {
    let bookingSubscription = null;

    const loadAndSubscribeToBooking = async () => {
      try {
        if (!user?.uid) return;

        // Get active booking using BookingService
        const activeBooking = await BookingService.getActiveBooking(user.uid);

        if (activeBooking) {
          console.log("Active booking loaded:", activeBooking.id);

          // Set booking state
          setActiveBooking(activeBooking);

          // Set map locations
          setPickupLocation({
            latitude: activeBooking.pickup.latitude,
            longitude: activeBooking.pickup.longitude,
            title: activeBooking.pickup.address,
            description: activeBooking.pickup.description,
          });

          setDropoffLocation({
            latitude: activeBooking.dropoff.latitude,
            longitude: activeBooking.dropoff.longitude,
            title: activeBooking.dropoff.address,
            description: activeBooking.dropoff.description,
          });

          // Set route info
          if (activeBooking.route) {
            setRouteInfo(activeBooking.route);

            // Fit map to show route
            if (mapRef.current && activeBooking.route.coordinates) {
              setTimeout(() => {
                mapRef.current.fitToCoordinates(
                  activeBooking.route.coordinates,
                  {
                    edgePadding: {
                      top: 100,
                      right: 50,
                      bottom: 100,
                      left: 50,
                    },
                    animated: true,
                  },
                );
              }, 1000);
            }
          }

          // Subscribe to booking updates
          bookingSubscription = BookingService.subscribeToBookingUpdates(
            activeBooking.id,
            user.uid,
            (updatedBooking) => {
              if (!updatedBooking) {
                handleClearBooking();
                return;
              }

              // Handle completed trip
              if (
                updatedBooking.status === "completed" &&
                !showCompletionModal
              ) {
                // Store completed trip details and show modal
                setCompletedTripDetails(updatedBooking);
                setShowCompletionModal(true);
                return;
              }

              setActiveBooking(updatedBooking);
              setRouteInfo(updatedBooking.route);

              // Update locations if needed
              setPickupLocation((prev) => ({
                ...prev,
                title: updatedBooking.pickup.address,
                description: updatedBooking.pickup.description,
              }));

              setDropoffLocation((prev) => ({
                ...prev,
                title: updatedBooking.dropoff.address,
                description: updatedBooking.dropoff.description,
              }));
            },
          );
        }
      } catch (error) {
        console.error("Error loading active booking:", error);
        setActiveBooking(null);
      }
    };

    // Load booking when user is available
    loadAndSubscribeToBooking();

    // Cleanup subscription
    return () => {
      if (bookingSubscription) {
        bookingSubscription();
      }
    };
  }, [user?.uid]);

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

  // Set initial pickup location when user location is available
  useEffect(() => {
    if (location?.coords && !pickupLocation) {
      setPickupLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    }
  }, [location]);

  const handleRouteInfoUpdate = (info, error) => {
    if (error) {
      setRouteError(error);
      setRouteInfo(null);
      return;
    }
    setRouteInfo(info);
    setRouteError(null);
  };

  const handleClearBooking = useCallback(async () => {
    if (!user?.uid || !activeBooking?.id) return;

    try {
      // Clear all route-related state first
      setPickupLocation(null);
      setDropoffLocation(null);
      setRouteInfo(null);
      setActiveBooking(null);

      // Then clear from storage
      await BookingService.clearActiveBooking(user.uid);

      // Reset map to current location if available
      if (location?.coords) {
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
      }
    } catch (error) {
      console.error("Error clearing booking:", error);
    }
  }, [user?.uid, activeBooking?.id, location]);

  // Preload marker images when component mounts
  // Handle booking flow
  const handleBookingLocationSelect = (type, selectedLocation) => {
    if (type === "pickup") {
      setPickupLocation(selectedLocation);
    } else {
      setDestinationLocation(selectedLocation);
    }
  };

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

  // Handle new booking display
  // useEffect(() => {
  //   if (route.params?.booking) {
  //     const { booking } = route.params;
  //     setActiveBooking(booking);
  //
  //     // Check for userId and save booking with proper persistence
  //     if (user?.uid) {
  //       // Save booking with userId
  //       BookingPersistenceService.saveActiveBooking(booking, user.uid);
  //
  //       // Set up subscription with userId
  //       bookingSubscription.current =
  //         BookingPersistenceService.subscribeToBookingUpdates(
  //           booking.id,
  //           user.uid,
  //           (updatedBooking) => {
  //             if (!updatedBooking) {
  //               handleClearBooking();
  //               return;
  //             }
  //             setActiveBooking(updatedBooking);
  //
  //             // Update route info if needed
  //             if (updatedBooking.route) {
  //               setRouteInfo({
  //                 distance: updatedBooking.route.distance,
  //                 duration: updatedBooking.route.duration,
  //                 fare: updatedBooking.route.fare,
  //                 coordinates: updatedBooking.route.coordinates,
  //               });
  //             }
  //           },
  //         );
  //
  //       // Update map with booking locations
  //       const formattedPickup = {
  //         latitude: booking.pickup.latitude,
  //         longitude: booking.pickup.longitude,
  //         title: booking.pickup.address,
  //         description: booking.pickup.description,
  //       };
  //
  //       const formattedDropoff = {
  //         latitude: booking.dropoff.latitude,
  //         longitude: booking.dropoff.longitude,
  //         title: booking.dropoff.address,
  //         description: booking.dropoff.description,
  //       };
  //
  //       setPickupLocation(formattedPickup);
  //       setDropoffLocation(formattedDropoff);
  //
  //       // Set initial route info
  //       if (booking.route) {
  //         setRouteInfo({
  //           distance: booking.route.distance,
  //           duration: booking.route.duration,
  //           fare: booking.route.fare,
  //           coordinates: booking.route.coordinates,
  //         });
  //
  //         // Fit map to show route
  //         if (mapRef.current && booking.route.coordinates) {
  //           setTimeout(() => {
  //             mapRef.current.fitToCoordinates(booking.route.coordinates, {
  //               edgePadding: {
  //                 top: 100,
  //                 right: 50,
  //                 bottom: 100,
  //                 left: 50,
  //               },
  //               animated: true,
  //             });
  //           }, 1000);
  //         }
  //       }
  //     }
  //
  //     // Clear route params
  //     navigation.setParams({ booking: undefined });
  //   }
  // }, [route.params?.booking, user?.uid]);

  const handleBookPress = () => {
    if (!isLocationEnabled) {
      setShowLocationAlert(true);
      return;
    }

    navigation.navigate("Booking", {
      pickupLocation: pickupLocation && {
        latitude: pickupLocation.latitude,
        longitude: pickupLocation.longitude,
        title: pickupLocation.title || "",
        description: pickupLocation.description,
      },
      dropoffLocation: dropoffLocation && {
        latitude: dropoffLocation.latitude,
        longitude: dropoffLocation.longitude,
        title: dropoffLocation.title,
        description: dropoffLocation.description,
      },
      routeInfo,
    });
  };

  const handleCompletionModalClose = () => {
    setShowCompletionModal(false);
    setCompletedTripDetails(null);
    handleClearBooking();
  };

  if (isInitializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ConnectionStatusBar />
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <StyledMapView
          ref={mapRef}
          onMapReady={() => setIsLoadingMap(false)}
          onRegionChange={handleRegionChange}
        >
          {mapContent}
        </StyledMapView>

        <DashboardHeader />

        <TripCompletionModal
          visible={showCompletionModal}
          onClose={handleCompletionModalClose}
          tripDetails={completedTripDetails}
        />

        {activeBooking && (
          <>
            <ActiveBookingCard
              booking={activeBooking}
              onDismiss={handleClearBooking}
            />
            {/* Only show directions when there's an active booking */}
            {pickupLocation && dropoffLocation && (
              <MapViewDirectionsCustom
                origin={pickupLocation}
                destination={dropoffLocation}
                mapRef={mapRef}
                onRouteInfoUpdate={handleRouteInfoUpdate}
                // isDriverView={isDriver}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            )}
          </>
        )}

        <CurrentLocationButton
          onPress={handleLocationButtonPress}
          loading={isLocating}
          style={styles.currentLocationButton}
        />

        <BookButton
          onPress={handleBookPress}
          disabled={!!activeBooking}
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

  currentLocationButton: {
    position: "absolute",
    top: 120,
    right: 16,
    zIndex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default React.memo(Dashboard);
