// src/components/map/markers/customMarkers.jsx
import React from "react";
import { StyleSheet } from "react-native";
import { Marker } from "react-native-maps";
import { colors } from "@constants/globalStyles";

// Optimized marker size constants
const MARKER_SIZES = {
  default: { width: 35, height: 35 },
  pickup: { width: 35, height: 35 },
  dropoff: { width: 35, height: 35 },
  tricycle: { width: 40, height: 40 },
};

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
    pinColor={"orange"}
  />
);

export const LocationMarker = ({
  coordinate,
  type = "pickup",
  onPress,
  identifier,
  title,
  description,
}) => (
  <Marker
    identifier={identifier}
    coordinate={coordinate}
    anchor={{ x: 0.5, y: 1 }}
    tracksViewChanges={false}
    onPress={onPress}
    title={title}
    description={description}
    pinColor={type === "pickup" ? "yellow" : "red"}
    key={type}
  />
);

export const DraggableLocationMarker = ({
  coordinate,
  onDragEnd,
  type = "destination",
  identifier,
  title,
  description,
}) => (
  <Marker
    identifier={identifier}
    coordinate={coordinate}
    draggable={true}
    onDragEnd={onDragEnd}
    anchor={{ x: 0.5, y: 1 }}
    tracksViewChanges={false}
    title={title}
    description={description}
    pinColor={type === "pickup" ? colors.primary : colors.secondary}
  />
);

const styles = StyleSheet.create({
  markerContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default {
  TricycleMarker,
  LocationMarker,
  DraggableLocationMarker,
};
