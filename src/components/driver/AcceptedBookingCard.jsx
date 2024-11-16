// src/components/driver/AcceptedBookingCard.jsx
import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";

const AcceptedBookingCard = ({ booking, onPress, routeInfo }) => {
  const formatDuration = (minutes) => {
    if (minutes < 1) return "Less than a minute";
    return `${Math.round(minutes)} min`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Locations */}
      <View style={styles.locationContainer}>
        <View style={styles.locationInfo}>
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={colors.primary}
          />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {booking.pickup.address}
            </Text>
            <Text style={styles.locationDescription} numberOfLines={1}>
              {booking.pickup.description}
            </Text>
          </View>
        </View>

        <View style={styles.routeIndicator} />

        <View style={styles.locationInfo}>
          <MaterialCommunityIcons
            name="map-marker-check"
            size={20}
            color={colors.secondary}
          />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {booking.dropoff.address}
            </Text>
            <Text style={styles.locationDescription} numberOfLines={1}>
              {booking.dropoff.description}
            </Text>
          </View>
        </View>
      </View>

      {routeInfo?.driverToPickup && (
        <View style={styles.routeInfoContainer}>
          <View style={styles.routeInfoItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.routeInfoText} numberOfLines={2}>
              {formatDuration(routeInfo.driverToPickup.duration)} to pickup
            </Text>
          </View>
          <View style={styles.routeInfoItem}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.routeInfoText} numberOfLines={2}>
              {routeInfo.driverToPickup.distance.toFixed(1)} km away
            </Text>
          </View>
        </View>
      )}

      {/* Footer with trip info */}
      <View style={styles.footer}>
        <View style={styles.tripInfo}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={18}
            color={colors.text}
          />
          <Text style={styles.tripInfoText}>
            {booking.route.distance.toFixed(1)} km
          </Text>
        </View>

        <View style={styles.fareInfo}>
          <MaterialCommunityIcons
            name="cash"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.fareText}>₱{booking.route.fare}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  routeInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    marginTop: 12,
    overflow: "hidden",
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeInfoText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  container: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    elevation: 6,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray + "20",
    width: "92%",
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 4,
  },
  locationTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  locationDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  routeIndicator: {
    width: 1,
    height: 20,
    backgroundColor: colors.gray + "40",
    marginLeft: 10,
    marginVertical: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    overflow: "hidden",
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
  fareInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  fareText: {
    marginLeft: 4,
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
});

export default AcceptedBookingCard;
