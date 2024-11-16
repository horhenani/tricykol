// src/components/map/MapViewDirectionsCustom.jsx
import React, { useCallback, useEffect, useMemo } from "react";
import MapViewDirections from "react-native-maps-directions";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { GOOGLE_MAPS_API_KEY } from "@config/keys";
import { colors, fonts } from "@constants/globalStyles";

const DEFAULT_EDGE_PADDING = {
  top: 100,
  right: 50,
  bottom: 100,
  left: 50,
};

const DEFAULT_DRIVER_EDGE_PADDING = {
  top: 150,
  right: 50,
  bottom: 200,
  left: 50,
};

const MapViewDirectionsCustom = ({
  origin,
  destination,
  mapRef,
  onRouteInfoUpdate,
  strokeWidth = 4,
  strokeColor = colors.blue,
  mode = "DRIVING",
  showRouteInfo = true,
  routeInfoStyle,
  isDriverView = false,
  waypoints,
}) => {
  // Memoize edge padding based on view type
  const edgePadding = useMemo(
    () => (isDriverView ? DEFAULT_DRIVER_EDGE_PADDING : DEFAULT_EDGE_PADDING),
    [isDriverView],
  );

  // Memoize coordinates for optimization
  const coordinates = useMemo(() => {
    if (!origin || !destination) return null;
    return {
      origin: {
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      destination: {
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
    };
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
  ]);

  const calculateFare = useCallback((distanceInKm) => {
    const baseFare = 30;
    const ratePerKm = 5;
    const additionalKm = Math.max(0, distanceInKm - 1);
    return Math.ceil(baseFare + additionalKm * ratePerKm);
  }, []);

  const handleRouteReady = useCallback(
    (result) => {
      if (!result || !result.coordinates?.length) return;

      const routeInfo = {
        distance: result.distance,
        duration: result.duration,
        coordinates: result.coordinates,
        fare: calculateFare(result.distance),
      };

      // Fit map to show full route with proper padding
      if (mapRef?.current?.fitToCoordinates && result.coordinates?.length > 0) {
        try {
          mapRef.current.fitToCoordinates(result.coordinates, {
            edgePadding,
            animated: true,
          });
        } catch (error) {
          console.warn("Error fitting map to coordinates:", error);
        }
      }

      onRouteInfoUpdate?.(routeInfo);
    },
    [mapRef, edgePadding, onRouteInfoUpdate, calculateFare],
  );

  const handleError = useCallback(
    (error) => {
      console.error("Directions Error:", error);
      onRouteInfoUpdate?.(null, error);
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

  if (!coordinates || !GOOGLE_MAPS_API_KEY || !mapRef?.current) return null;

  return (
    <MapViewDirections
      origin={coordinates.origin}
      destination={coordinates.destination}
      waypoints={waypoints}
      apikey={GOOGLE_MAPS_API_KEY}
      strokeWidth={strokeWidth}
      strokeColor={strokeColor}
      mode={mode}
      precision="high"
      timePrecision="now"
      onReady={handleRouteReady}
      onError={handleError}
      resetOnChange={false}
      optimizeWaypoints={true}
      splitWaypoints={true}
      language="en"
      region="ph"
      // strokePattern={[1]}
      // lineDashPattern={[1]}
      // lineCap="round"
      // lineJoin="round"
      geodesic={true}
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

export default React.memo(MapViewDirectionsCustom, (prevProps, nextProps) => {
  return (
    prevProps.origin?.latitude === nextProps.origin?.latitude &&
    prevProps.origin?.longitude === nextProps.origin?.longitude &&
    prevProps.destination?.latitude === nextProps.destination?.latitude &&
    prevProps.destination?.longitude === nextProps.destination?.longitude &&
    prevProps.strokeColor === nextProps.strokeColor &&
    prevProps.strokeWidth === nextProps.strokeWidth &&
    prevProps.mode === nextProps.mode
  );
});
