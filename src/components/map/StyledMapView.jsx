import React, {
  useRef,
  useImperativeHandle,
  useCallback,
  forwardRef,
} from "react";
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

    // Enhanced version of animateToRegion
    const animateToRegion = useCallback((region, duration = 1000) => {
      if (!mapRef.current || !region) return;

      // Ensure all required properties exist with fallbacks
      const completeRegion = {
        latitude: region.latitude,
        longitude: region.longitude,
        latitudeDelta: region.latitudeDelta || LATITUDE_DELTA,
        longitudeDelta: region.longitudeDelta || LONGITUDE_DELTA,
      };

      mapRef.current.animateToRegion(completeRegion, duration);
    }, []);

    // Enhanced version of animateToLocation
    const animateToLocation = useCallback(
      (location, duration = 1000) => {
        if (!location?.coords) return;

        const region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA / 4, // Zoom in closer
          longitudeDelta: LONGITUDE_DELTA / 4,
        };

        animateToRegion(region, duration);
      },
      [animateToRegion],
    );

    // Expose map methods to parent components with enhanced versions
    useImperativeHandle(ref, () => ({
      ...mapRef.current, // Forward all MapView methods
      animateToRegion: (region, duration = 1000) => {
        if (!mapRef.current || !region) return;

        const completeRegion = {
          latitude: region.latitude,
          longitude: region.longitude,
          latitudeDelta: region.latitudeDelta || LATITUDE_DELTA,
          longitudeDelta: region.longitudeDelta || LONGITUDE_DELTA,
        };

        mapRef.current.animateToRegion(completeRegion, duration);
      },
      fitToCoordinates: (coordinates, options) => {
        if (!mapRef.current || !coordinates) return;
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 50,
            right: 50,
            bottom: 50,
            left: 50,
          },
          animated: true,
          ...options,
        });
      },
      getMapBoundaries: async () => {
        if (!mapRef.current) return null;
        return await mapRef.current.getMapBoundaries();
      },
      getCurrentRef: () => mapRef.current,
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
        showsMyLocationButton={false} // Set to false using custom button
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
