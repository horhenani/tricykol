// src/components/driver/AvailableBookingCard.jsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import { useState } from "react";

const AvailableBookingCard = ({ booking, onAccept }) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptPress = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Location Details */}
      <View style={styles.locationContainer}>
        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="map-marker"
            size={24}
            color={colors.primary}
          />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>{booking.pickup.address}</Text>
            <Text style={styles.locationDescription} numberOfLines={1}>
              {booking.pickup.description}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="map-marker-check"
            size={24}
            color={colors.secondary}
          />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Drop-off</Text>
            <Text style={styles.locationText}>{booking.dropoff.address}</Text>
            <Text style={styles.locationDescription} numberOfLines={1}>
              {booking.dropoff.description}
            </Text>
          </View>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.tripDetails}>
        <View style={styles.tripInfo}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={20}
            color={colors.text}
          />
          <Text style={styles.tripInfoText}>
            {booking.route.distance.toFixed(1)} km
          </Text>
        </View>

        <View style={styles.tripInfo}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={20}
            color={colors.text}
          />
          <Text style={styles.tripInfoText}>
            {Math.ceil(booking.route.duration)} mins
          </Text>
        </View>

        <View style={styles.tripInfo}>
          <MaterialCommunityIcons
            name="cash"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.tripInfoText, styles.fareText]}>
            ₱{booking.route.fare}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={handleAcceptPress}
        activeOpacity={0.7}
      >
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.gray,
  },
  locationText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginVertical: 2,
  },
  locationDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray + "20",
    marginVertical: 12,
  },
  tripDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  tripInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripInfoText: {
    marginLeft: 4,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  fareText: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
});

export default AvailableBookingCard;
