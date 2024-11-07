// src/components/map/markers/customMarkers.jsx
// src/components/map/markers/customMarkers.jsx
import React from "react";
import { Image, StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { MarkerImages } from "@utils/markerImagePreload";

export const LocationMarker = ({
  coordinate,
  type = "pickup", // 'pickup' or 'destination'
  draggable = false,
  onDrag,
  onDragEnd,
  identifier,
  title,
  description,
}) => {
  // Choose correct marker image based on type
  const markerImage =
    type === "pickup" ? MarkerImages.PICKUP : MarkerImages.DESTINATION;

  return (
    <Marker
      identifier={identifier}
      coordinate={coordinate}
      draggable={draggable}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
      title={title}
      description={description}
      image={markerImage}
    />
  );
};

// You can add more marker types here
export const TricycleMarker = ({
  coordinate,
  rotation = 0,
  isActive = false,
  onPress,
  identifier,
}) => (
  <Marker
    identifier={identifier}
    coordinate={coordinate}
    rotation={rotation}
    anchor={{ x: 0.5, y: 0.5 }}
    flat={true}
    tracksViewChanges={false}
    onPress={onPress}
    image={MarkerImages.TRICYCLE}
  />
);

const styles = StyleSheet.create({
  markerImage: {
    width: 40,
    height: 40,
  },
});

export default {
  TricycleMarker,
  LocationMarker,
};
