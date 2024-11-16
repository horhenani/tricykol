import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { colors } from "@constants/globalStyles";
import { GOOGLE_MAPS_API_KEY } from "@config/keys";
import {
  LocationMarker,
  TricycleMarker,
} from "@components/map/markers/customMarkers";
import MapViewDirections from "react-native-maps-directions";

const DEFAULT_EDGE_PADDING = {
  top: 100,
  right: 50,
  bottom: 150,
  left: 50,
};

const DriverMapDirections = ({
  driverLocation,
  booking,
  mapRef,
  onRouteUpdate,
}) => {
  const [driverToPickupInfo, setDriverToPickupInfo] = useState(null);
  const [pickupToDropoffInfo, setPickupToDropoffInfo] = useState(null);

  useEffect(() => {
    if (mapRef?.current && booking && driverLocation) {
      // Fit map to show all points
      const coordinates = [
        {
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
        },
        {
          latitude: booking.pickup.latitude,
          longitude: booking.pickup.longitude,
        },
        {
          latitude: booking.dropoff.latitude,
          longitude: booking.dropoff.longitude,
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
  }, [booking, driverLocation]);

  // Calculate rotation angle based on coordinates
  const calculateRotation = (start, end) => {
    if (!start || !end) return 0;
    const dx = end.longitude - start.longitude;
    const dy = end.latitude - start.latitude;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  const driverRotation = React.useMemo(() => {
    if (driverLocation && booking?.pickup) {
      return calculateRotation(driverLocation, {
        latitude: booking.pickup.latitude,
        longitude: booking.pickup.longitude,
      });
    }
    return 0;
  }, [driverLocation, booking?.pickup]);

  return (
    <>
      {/* Driver Location Marker */}
      {driverLocation && (
        <TricycleMarker
          coordinate={driverLocation}
          rotation={driverRotation}
          identifier="driver"
          isActive={true}
        />
      )}

      {/* Pickup Location Marker */}
      {booking?.pickup && (
        <LocationMarker
          coordinate={{
            latitude: booking.pickup.latitude,
            longitude: booking.pickup.longitude,
          }}
          type="pickup"
          identifier="pickup"
          title={booking.pickup.address}
          description={booking.pickup.description}
        />
      )}

      {/* Dropoff Location Marker */}
      {booking?.dropoff && (
        <LocationMarker
          coordinate={{
            latitude: booking.dropoff.latitude,
            longitude: booking.dropoff.longitude,
          }}
          type="destination"
          identifier="dropoff"
          title={booking.dropoff.address}
          description={booking.dropoff.description}
        />
      )}

      {/* Driver to Pickup Route */}
      {driverLocation && booking?.pickup && (
        <MapViewDirections
          origin={driverLocation}
          destination={{
            latitude: booking.pickup.latitude,
            longitude: booking.pickup.longitude,
          }}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={4}
          strokeColor={colors.primary}
          mode="DRIVING"
          onReady={(result) => {
            setDriverToPickupInfo(result);
            if (onRouteUpdate) {
              onRouteUpdate({
                driverToPickup: result,
                pickupToDropoff: pickupToDropoffInfo,
              });
            }
          }}
          // directionsServiceBaseUrl="https://maps.googleapis.com/maps/api/directions/json"
          locationEnabled={true}
          optimizeWaypoints={true}
        />
      )}

      {/* Pickup to Dropoff Route */}
      {booking?.pickup && booking?.dropoff && (
        <MapViewDirections
          origin={{
            latitude: booking.pickup.latitude,
            longitude: booking.pickup.longitude,
          }}
          destination={{
            latitude: booking.dropoff.latitude,
            longitude: booking.dropoff.longitude,
          }}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={4}
          strokeColor={colors.blue}
          strokePattern={[10, 5]}
          mode="DRIVING"
          // directionsServiceBaseUrl="https://maps.googleapis.com/maps/api/directions/json"
          locationEnabled={true}
          onReady={(result) => {
            setPickupToDropoffInfo(result);
            if (onRouteUpdate) {
              onRouteUpdate({
                driverToPickup: driverToPickupInfo,
                pickupToDropoff: result,
              });
            }
          }}
          optimizeWaypoints={true}
        />
      )}
    </>
  );
};

export default React.memo(DriverMapDirections);
