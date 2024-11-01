import React, { useRef, useImperativeHandle, useCallback } from "react";
import { StyleSheet, Dimensions } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const StyledMapView = React.forwardRef(
  ({ initialRegion, onRegionChange, children, ...props }, ref) => {
    const mapRef = useRef(null);

    // Default region (Paniqui)
    const defaultRegion = {
      latitude: 15.6626,
      longitude: 120.5814,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };

    // Expose map methods to parent components
    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration = 1000) => {
        mapRef.current?.animateToRegion(region, duration);
      },
      animateToLocation: (location, duration = 1000) => {
        if (!location?.coords) return;

        mapRef.current?.animateToRegion(
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: LATITUDE_DELTA / 4, // Zoom in closer
            longitudeDelta: LONGITUDE_DELTA / 4,
          },
          duration,
        );
      },
      getMapBounds: async () => {
        if (!mapRef.current) return null;
        return await mapRef.current.getMapBoundaries();
      },
    }));

    const handleRegionChange = useCallback(
      (region) => {
        onRegionChange?.(region);
      },
      [onRegionChange],
    );

    return (
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion || defaultRegion}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
        loadingEnabled={true}
        {...props}
      >
        {children}
      </MapView>
    );
  },
);

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default StyledMapView;
