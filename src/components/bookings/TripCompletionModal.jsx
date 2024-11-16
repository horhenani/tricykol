import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Portal, Modal, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";

const TripCompletionModal = ({ visible, onClose, tripDetails }) => {
  if (!tripDetails) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        dismissable={false}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.content}>
          {/* Header with Success Icon */}
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="check-circle"
              size={64}
              color={colors.success}
            />
            <Text style={styles.title}>Trip Completed!</Text>
            <Text style={styles.subtitle}>
              Thank you for riding with Tricykol
            </Text>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={24}
                color={colors.text}
              />
              <Text style={styles.detailText}>
                Distance: {tripDetails.route.distance.toFixed(1)} km
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={24}
                color={colors.text}
              />
              <Text style={styles.detailText}>
                Duration: {Math.ceil(tripDetails.route.duration)} mins
              </Text>
            </View>

            <View style={styles.fareContainer}>
              <MaterialCommunityIcons
                name="cash"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.fareText}>₱{tripDetails.route.fare}</Text>
            </View>
          </View>

          {/* Driver Details */}
          <View style={styles.driverDetails}>
            <MaterialCommunityIcons
              name="account"
              size={32}
              color={colors.text}
            />
            <Text style={styles.driverName}>
              {tripDetails.driverInfo?.name || "Your Driver"}
            </Text>
          </View>

          {/* Locations */}
          <View style={styles.locations}>
            <View style={styles.locationItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color={colors.primary}
              />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>From</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {tripDetails.pickup.address}
                </Text>
              </View>
            </View>

            <View style={styles.locationItem}>
              <MaterialCommunityIcons
                name="map-marker-check"
                size={20}
                color={colors.secondary}
              />
              <View style={styles.locationText}>
                <Text style={styles.locationLabel}>To</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {tripDetails.dropoff.address}
                </Text>
              </View>
            </View>
          </View>

          {/* Close Button */}
          <CustomButton
            title="Close"
            onPress={onClose}
            style={styles.closeButton}
          />
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: colors.background,
    margin: 20,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.gray,
    textAlign: "center",
  },
  tripDetails: {
    width: "100%",
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  fareContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
  },
  fareText: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: colors.primary,
    marginLeft: 12,
  },
  driverDetails: {
    alignItems: "center",
    marginBottom: 24,
  },
  driverName: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 8,
  },
  locations: {
    width: "100%",
    marginBottom: 24,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  locationAddress: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  closeButton: {
    width: "100%",
  },
});

export default TripCompletionModal;
