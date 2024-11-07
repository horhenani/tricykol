// src/components/map/markers/DraggableLocationMarker.jsx

import React from "react";
import { Marker } from "react-native-maps";
import { MarkerImages } from "@utils/markerImagePreload";

const DraggableLocationMarker = ({
  coordinate,
  onDragEnd,
  type = "destination",
  identifier,
  title,
  description,
}) => {
  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <Marker
      identifier={identifier}
      coordinate={coordinate}
      draggable={true}
      onDragEnd={handleDragEnd}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
      image={type === "pickup" ? MarkerImages.PICKUP : MarkerImages.DESTINATION}
      title={title}
      description={description}
    />
  );
};

export default DraggableLocationMarker;
