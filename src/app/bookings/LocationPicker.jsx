import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@constants/globalStyles";
import StyledMapView from "@components/map/StyledMapView";
import CurrentLocationButton from "@components/map/CurrentLocationButton";
import useLocationService from "@services/useLocationService";
import LocationPickerAppHeader from "@components/LocationPickerAppHeader";
import CustomButton from "@components/CustomButton";
import { LocationMarker } from "@components/map/markers/customMarkers";
import { LocationCacheService } from "@services/locationCacheService";
import MapViewDirectionsCustom, {
  RouteInfo,
} from "@components/map/directions/MapViewDirectionsCustom";

const LocationPicker = ({ navigation, route }) => {
  const mapRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [isLocating, setIsLocating] = useState(false);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [activeMode, setActiveMode] = useState("pickup");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeError, setRouteError] = useState(null);

  const { getCurrentLocation, location } = useLocationService();

  // Initialize with route params
  useEffect(() => {
    if (route.params?.initialPickup) {
      setPickupLocation(route.params.initialPickup);
      // Center map on pickup location if available
      mapRef.current?.animateToRegion({
        latitude: route.params.initialPickup.latitude,
        longitude: route.params.initialPickup.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
    if (route.params?.initialDropoff) {
      setDropoffLocation(route.params.initialDropoff);
    }
    if (route.params?.activeInput) {
      setActiveMode(route.params.activeInput);
    }
  }, []);

  // const handleRouteUpdate = (info) => {
  //   setRouteInfo(info);
  // };

  const handleRouteInfoUpdate = (info, error) => {
    if (error) {
      setRouteError(error);
      setRouteInfo(null);
      return;
    }
    setRouteInfo(info);
    setRouteError(null);
  };

  const handleLocationSelect = async (e) => {
    try {
      const { latitude, longitude } = e.nativeEvent.coordinate;

      // Show immediate feedback with loading state
      const tempLocation = {
        latitude,
        longitude,
        title: "Getting location...",
        description: "Please wait...",
      };

      if (activeMode === "pickup") {
        setPickupLocation(tempLocation);
      } else {
        setDropoffLocation(tempLocation);
      }

      setIsLoadingAddress(true);

      // Get address data
      const locationData = await LocationCacheService.getAddressFromCoordinates(
        latitude,
        longitude,
      );

      // Update with full location data
      const finalLocation = {
        latitude,
        longitude,
        title: locationData.name,
        description: locationData.address,
      };

      if (activeMode === "pickup") {
        setPickupLocation(finalLocation);
      } else {
        setDropoffLocation(finalLocation);
      }

      // Animate map to show the selected location
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    } catch (error) {
      console.error("Error selecting location:", error);
      // Handle error state if needed
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMarkerDrag = (e, type) => {
    // Just update position during drag without getting address
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const location = {
      latitude,
      longitude,
      title: type === "pickup" ? pickupLocation?.title : dropoffLocation?.title,
      description:
        type === "pickup"
          ? pickupLocation?.description
          : dropoffLocation?.description,
    };

    if (type === "pickup") {
      setPickupLocation(location);
    } else {
      setDropoffLocation(location);
    }
  };

  const handleMarkerDragEnd = async (e, type) => {
    try {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setIsLoadingAddress(true);

      // Get address for final position
      const locationData = await LocationCacheService.getAddressFromCoordinates(
        latitude,
        longitude,
      );

      const finalLocation = {
        latitude,
        longitude,
        title: locationData.name,
        description: locationData.address,
      };

      if (type === "pickup") {
        setPickupLocation(finalLocation);
      } else {
        setDropoffLocation(finalLocation);
      }
    } catch (error) {
      console.error("Error updating location after drag:", error);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleCurrentLocation = async () => {
    if (isLocating) return;
    setIsLocating(true);

    try {
      const currentLocation = await getCurrentLocation();

      if (currentLocation?.coords) {
        const { latitude, longitude } = currentLocation.coords;

        setIsLoadingAddress(true);
        const locationData =
          await LocationCacheService.getAddressFromCoordinates(
            latitude,
            longitude,
          );

        const location = {
          latitude,
          longitude,
          title: locationData.name,
          description: locationData.address,
        };

        if (activeMode === "pickup") {
          setPickupLocation(location);
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          });
        } else {
          setDropoffLocation(location);
        }
      }
    } catch (error) {
      console.error("Error getting current location:", error);
    } finally {
      setIsLocating(false);
      setIsLoadingAddress(false);
    }
  };

  const handleConfirm = () => {
    navigation.navigate("Booking", {
      pickupLocation,
      dropoffLocation,
      updatedLocations: true,
    });
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>

      <StyledMapView
        ref={mapRef}
        style={styles.map}
        onPress={handleLocationSelect}
        showsUserLocation={true}
      >
        {/* Directions */}
        {pickupLocation && dropoffLocation && (
          <MapViewDirectionsCustom
            origin={pickupLocation}
            destination={dropoffLocation}
            mapRef={mapRef}
            onRouteInfoUpdate={handleRouteInfoUpdate}
          />
        )}
        {pickupLocation && (
          <LocationMarker
            coordinate={pickupLocation}
            draggable={true}
            onDrag={(e) => handleMarkerDrag(e, "pickup")}
            onDragEnd={(e) => handleMarkerDragEnd(e, "pickup")}
            type="pickup"
            identifier="pickup"
            title={pickupLocation.title}
            description={pickupLocation.description}
          />
        )}
        {dropoffLocation && (
          <LocationMarker
            coordinate={dropoffLocation}
            draggable={true}
            onDrag={(e) => handleMarkerDrag(e, "dropoff")}
            onDragEnd={(e) => handleMarkerDragEnd(e, "dropoff")}
            type="destination"
            identifier="dropoff"
            title={dropoffLocation.title}
            description={dropoffLocation.description}
          />
        )}
      </StyledMapView>
      <LocationPickerAppHeader />

      {routeInfo && !routeError && <RouteInfo routeInfo={routeInfo} />}

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            activeMode === "pickup" && styles.activeMode,
          ]}
          onPress={() => setActiveMode("pickup")}
        >
          <MaterialCommunityIcons
            name="map-marker"
            size={24}
            color={activeMode === "pickup" ? colors.primary : colors.gray}
          />
          <Text
            style={[
              styles.modeText,
              activeMode === "pickup" && styles.activeModeText,
            ]}
          >
            Set Pickup
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            activeMode === "dropoff" && styles.activeMode,
          ]}
          onPress={() => setActiveMode("dropoff")}
        >
          <MaterialCommunityIcons
            name="map-marker-check"
            size={24}
            color={activeMode === "dropoff" ? colors.primary : colors.gray}
          />
          <Text
            style={[
              styles.modeText,
              activeMode === "dropoff" && styles.activeModeText,
            ]}
          >
            Set Dropoff
          </Text>
        </TouchableOpacity>
      </View>

      <CurrentLocationButton
        onPress={handleCurrentLocation}
        loading={isLocating}
        style={styles.locationButton}
      />

      {(pickupLocation || dropoffLocation) && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20}]}>
          <CustomButton
            title="Confirm Locations"
            onPress={handleConfirm}
            disabled={!pickupLocation || !dropoffLocation || isLoadingAddress}
            loading={isLoadingAddress}
            style={styles.confirmButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

// Keep your existing styles...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    elevation: 5,
    shadowColor: colors.text,
    height: 100,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  confirmButton: {
    // width: "100%",
  },
  modeSelector: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: colors.background,
    borderRadius: 8,
    flexDirection: "row",
    padding: 8,
    elevation: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 6,
  },
  activeMode: {
    backgroundColor: colors.primary + "20",
  },
  modeText: {
    marginLeft: 8,
    fontFamily: fonts.medium,
    color: colors.gray,
  },
  activeModeText: {
    color: colors.text,
  },
  locationButton: {
    bottom: 120,
  },
  confirmText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});

export default LocationPicker;
