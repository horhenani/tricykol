// src/components/map/MapViewDirectionsCustom.jsx
import React, { useCallback, useEffect } from "react";
import MapViewDirections from "react-native-maps-directions";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { GOOGLE_MAPS_API_KEY } from "@config/keys";
import { colors, fonts } from "@constants/globalStyles";

const MapViewDirectionsCustom = ({
  origin,
  destination,
  mapRef,
  onRouteInfoUpdate,
  strokeWidth = 5,
  strokeColor = colors.blue,
  mode = "DRIVING",
  showRouteInfo = true,
  routeInfoStyle,
}) => {
  const calculateFare = useCallback((distanceInKm) => {
    const baseFare = 40;
    const ratePerKm = 5;
    const additionalKm = Math.max(0, distanceInKm - 1);
    return Math.ceil(baseFare + additionalKm * ratePerKm);
  }, []);

  const handleRouteReady = useCallback(
    (result) => {
      const routeInfo = {
        distance: result.distance,
        duration: result.duration,
        coordinates: result.coordinates,
        fare: calculateFare(result.distance),
      };

      if (mapRef?.current?.fitToCoordinates) {
        try {
          mapRef.current.fitToCoordinates(result.coordinates, {
            edgePadding: {
              top: 50,
              right: 50,
              bottom: 50,
              left: 50,
            },
            animated: true,
          });
        } catch (error) {
          console.warn("Error fitting map to coordinates:", error);
        }
      }

      if (onRouteInfoUpdate) {
        onRouteInfoUpdate(routeInfo);
      }
    },
    [mapRef, onRouteInfoUpdate, calculateFare],
  );

  const handleError = useCallback(
    (error) => {
      console.error("Directions Error:", error);
      if (onRouteInfoUpdate) {
        onRouteInfoUpdate(null, error);
      }
    },
    [onRouteInfoUpdate],
  );

  // Debug logging
  useEffect(() => {
    if (__DEV__) {
      console.log("MapViewDirections render:", {
        hasOrigin: !!origin,
        hasDestination: !!destination,
        hasApiKey: !!GOOGLE_MAPS_API_KEY,
        hasMapRef: !!mapRef?.current,
      });
    }
  }, [origin, destination, mapRef]);

  if (!origin || !destination || !GOOGLE_MAPS_API_KEY) return null;

  return (
    <MapViewDirections
      origin={origin}
      destination={destination}
      apikey={GOOGLE_MAPS_API_KEY}
      strokeWidth={strokeWidth}
      strokeColor={strokeColor}
      mode={mode}
      precision="high"
      timePrecision="now"
      onReady={handleRouteReady}
      onError={handleError}
      resetOnChange={false}
    />
  );
};

export const RouteInfo = ({ routeInfo, style }) => {
  if (!routeInfo) return null;

  return (
    <View style={[styles.routeInfoContainer, style]}>
      <Text style={styles.routeInfoText}>
        {routeInfo.distance.toFixed(1)} km • {Math.ceil(routeInfo.duration)}{" "}
        mins
      </Text>
      <Text style={styles.fareText}>₱{routeInfo.fare}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  routeInfoContainer: {
    position: "absolute",
    top: 180,
    left: 20,
    right: 20,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 4,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  routeInfoText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  fareText: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
});

export default React.memo(MapViewDirectionsCustom);
