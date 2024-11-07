// src/components/map/MapRoute.jsx
import React, { useEffect, useState } from "react";
import { Polyline } from "react-native-maps";
import { colors } from "@constants/globalStyles";
import { DirectionsService } from "@services/directionsService";

const MapRoute = ({
  origin,
  destination,
  onRouteUpdate,
  strokeWidth = 3,
  strokeColor = colors.primary,
}) => {
  const [routeData, setRouteData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadRoute = async () => {
      if (!origin || !destination) return;

      try {
        const data = await DirectionsService.getDirections(origin, destination);

        if (isMounted) {
          setRouteData(data);
          if (onRouteUpdate) {
            onRouteUpdate({
              distance: data.distance,
              duration: data.duration,
              fare: data.fare,
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          console.error("Error loading route:", err);
        }
      }
    };

    loadRoute();

    return () => {
      isMounted = false;
    };
  }, [origin, destination]);

  if (!routeData?.points || error) return null;

  return (
    <Polyline
      coordinates={routeData.points}
      strokeWidth={strokeWidth}
      strokeColor={strokeColor}
      geodesic={true}
      lineDashPattern={[1]}
      zIndex={1}
    />
  );
};

export default MapRoute;
