import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Text, Divider, Portal, Modal, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Collapsible from "react-native-collapsible";
import { BookingService } from "@services/bookingService";
import { useAuth } from "@context/AuthContext";
import { showMessage } from "react-native-flash-message";
import * as Linking from "expo-linking";

const BookingStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  ARRIVED: "arrived",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const CancellationReasons = [
  { id: "changed_mind", label: "Changed my mind" },
  { id: "wrong_location", label: "Wrong location entered" },
  { id: "long_wait", label: "Waiting too long" },
  { id: "other", label: "Other reason" },
];

const ActiveBookingCard = ({ booking, onStateChange, onDismiss }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const insets = useSafeAreaInsets();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const { user } = useAuth();

  const handleDismiss = async () => {
    try {
      if (typeof onDismiss === "function") {
        await onDismiss();
      }
    } catch (error) {
      console.error("Error dismissing booking:", error);
      // Show error message to user if needed
      showMessage({
        message: "Error",
        description: "Could not clear booking. Please try again.",
        type: "error",
      });
    }
  };

  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
      console.log("No phone number provided");
      return null;
    }

    try {
      // Remove all non-numeric characters
      let cleaned = phoneNumber.replace(/\D/g, "");

      // Remove leading zeros
      cleaned = cleaned.replace(/^0+/, "");

      // Remove '63' if it starts with it
      if (cleaned.startsWith("63")) {
        cleaned = cleaned.substring(2);
      }

      // Check if number is valid (should be 10 digits after cleaning)
      if (cleaned.length !== 10) {
        console.log("Invalid phone number length:", cleaned.length);
        return null;
      }

      // Add proper prefix
      return `+63${cleaned}`;
    } catch (error) {
      console.error("Error formatting phone number:", error);
      return null;
    }
  };

  const handleMessagePress = async () => {
    try {
      console.log("Booking driver info:", booking?.driverInfo);

      if (!booking?.driverInfo?.phoneNumber) {
        Alert.alert("Error", "No phone number available for driver");
        return;
      }

      const phoneNumber = formatPhoneNumber(booking.driverInfo.phoneNumber);

      if (!phoneNumber) {
        Alert.alert("Error", "Invalid phone number format");
        return;
      }

      // Construct message
      const message = encodeURIComponent(`Hi Angkol!`);

      // Platform specific SMS URL with message
      const smsUrl = Platform.select({
        android: `sms:${phoneNumber}?body=${message}`,
        ios: `sms:${phoneNumber}&body=${message}`,
      });

      const canOpen = await Linking.canOpenURL(smsUrl);

      if (!canOpen) {
        Alert.alert("Error", "Cannot open messaging app");
        return;
      }

      await Linking.openURL(smsUrl);
    } catch (error) {
      console.error("Error opening messaging app:", error);
      Alert.alert(
        "Error",
        "Unable to open messaging app. Please try again later.",
      );
    }
  };

  const handleCallPress = async () => {
    try {
      if (!booking?.driverInfo?.phoneNumber) {
        Alert.alert("Error", "No phone number available");
        return;
      }

      const phoneNumber = formatPhoneNumber(booking.driverInfo.phoneNumber);

      if (!phoneNumber) {
        Alert.alert("Error", "Invalid phone number format");
        return;
      }

      const telUrl = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(telUrl);

      if (!canOpen) {
        Alert.alert("Error", "Cannot make phone calls from this device");
        return;
      }

      await Linking.openURL(telUrl);
    } catch (error) {
      console.error("Error making phone call:", error);
      Alert.alert("Error", "Failed to make phone call");
    }
  };

  const renderDriverInfo = () => {
    if (!booking.driverInfo) return null;

    return (
      <View style={styles.driverInfoSection}>
        <View style={styles.driverDetails}>
          <View style={styles.driverInfo}>
            <MaterialCommunityIcons
              name="account"
              size={32}
              color={colors.text}
            />
            <View style={styles.driverText}>
              <Text style={styles.driverName}>{booking.driverInfo.name}</Text>
              <Text style={styles.driverPhone}>
                {formatPhoneNumber(booking.driverInfo.phoneNumber)}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            {/* Chat Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMessagePress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="chat"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>

            {/* Call Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCallPress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="phone"
                size={24}
                color={colors.success}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* License Plate or Vehicle Info */}
        {booking.driverInfo.plateNumber && (
          <View style={styles.vehicleInfo}>
            <MaterialCommunityIcons
              name="card-bulleted"
              size={20}
              color={colors.text}
            />
            <Text style={styles.plateNumber}>
              {booking.driverInfo.plateNumber}
            </Text>
          </View>
        )}
      </View>
    );
  };

  useEffect(() => {
    if (onStateChange) {
      onStateChange(isCollapsed);
    }
  }, [isCollapsed, onStateChange]);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case BookingStatus.PENDING:
        return {
          message: "Finding Drivers...",
          icon: "magnify",
          color: colors.warning,
        };
      case BookingStatus.ACCEPTED:
        return {
          message: "Angkol is on the way!",
          icon: "tricycle",
          color: colors.primary,
        };
      case BookingStatus.ARRIVED:
        return {
          message: "Driver has arrived at pickup",
          icon: "map-marker-check",
          color: colors.success,
        };
      case BookingStatus.IN_PROGRESS:
        return {
          message: "On the way to destination",
          icon: "navigation",
          color: colors.primary,
        };
      default:
        return {
          message: "Finding Drivers...",
          icon: "magnify",
          color: colors.warning,
        };
    }
  };

  const statusInfo = getStatusMessage(booking.status);

  // const handleCancelBooking = async () => {
  //   try {
  //     if (!booking?.id) return;
  //
  //     // Only allow cancellation in certain states
  //     if (!["pending", "accepted"].includes(booking.status)) {
  //       showMessage({
  //         message: "Cannot cancel booking",
  //         description: "Trip is already in progress",
  //         type: "warning",
  //       });
  //       return;
  //     }
  //
  //     // Check if cancellation fee applies
  //     const cancellationFee = booking.status === "accepted" ? 20 : 0; // Example fee
  //
  //     setShowCancelDialog(true);
  //   } catch (error) {
  //     console.error("Error handling cancellation:", error);
  //   }
  // };

  const handleCancellation = async () => {
    if (!cancellationReason) {
      showMessage({
        message: "Please select a reason",
        description: "A cancellation reason is required",
        type: "warning",
      });
      return;
    }

    try {
      if (!booking?.id || !user?.uid) return;

      // First hide the dialog
      setShowCancelDialog(false);

      await BookingService.cancelBooking(
        booking.id,
        user.uid,
        cancellationReason,
      );

      // Clear the reason
      setCancellationReason("");

      // Callback to remove card
      if (onDismiss) {
        onDismiss();
      }

      showMessage({
        message: "Booking Cancelled",
        description: "Your booking has been cancelled successfully",
        type: "success",
      });
    } catch (error) {
      console.error("Error cancelling booking:", error);
      showMessage({
        message: "Unable to cancel booking",
        description: "Please try again",
        type: "error",
      });
    }
  };

  const handleCancelPress = () => {
    setCancellationReason(""); // Reset reason
    setShowCancelDialog(true);
  };

  const confirmCancellation = async () => {
    if (!cancellationReason) {
      showMessage({
        message: "Please select a reason",
        description: "A cancellation reason is required",
        type: "warning",
      });
      return;
    }

    handleCancellation(cancellationReason);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header - Always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={handleToggleCollapse}
        activeOpacity={0.5}
      >
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
              <Text style={styles.locationDescription} numberOfLines={2}>
                {booking.pickup.description}
              </Text>
            </View>
          </View>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Divider style={styles.divider} />
            <Divider style={styles.divider} />
            <Divider style={styles.divider} />
          </View>

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
              <Text style={styles.locationDescription} numberOfLines={2}>
                {booking.dropoff.description}
              </Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons
          name={isCollapsed ? "chevron-down" : "chevron-up"}
          size={24}
          color={colors.gray}
        />
      </TouchableOpacity>

      {/* Collapsible Content */}
      <Collapsible collapsed={isCollapsed}>
        <ScrollView
          style={styles.content}
          bounces={true}
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {/* Status Message */}
          <View style={styles.statusContainer}>
            <MaterialCommunityIcons
              name={statusInfo.icon}
              size={24}
              color={statusInfo.color}
            />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.message}
            </Text>
          </View>

          {/*{booking.driverInfo && (
            <View style={styles.driverInfo}>
              <MaterialCommunityIcons
                name="account"
                size={24}
                color={colors.text}
              />
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{booking.driverInfo.name}</Text>
                <Text style={styles.driverPhonenumber}>
                  {booking.driverInfo.phonenumber}
                </Text>
                <Text style={styles.plateNumber}>
                  {booking.driverInfo.plateNumber}
                </Text>
              </View>
            </View>
          )}*/}

          {renderDriverInfo()}

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.tripItem}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={20}
                color={colors.text}
              />
              <Text style={styles.tripText}>
                {booking.route.distance.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.tripItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={colors.text}
              />
              <Text style={styles.tripText}>
                {Math.ceil(booking.route.duration)} mins
              </Text>
            </View>
          </View>

          {["pending", "accepted"].includes(booking.status) && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelPress}
            >
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={colors.error}
              />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Collapsible>

      {/* Footer - Always visible */}
      <View style={styles.footer}>
        <View style={styles.paymentMethod}>
          <MaterialCommunityIcons name="cash" size={20} color={colors.text} />
          <Text style={styles.paymentText}>Cash</Text>
        </View>

        <View style={styles.statusIndicator}>
          <Text style={styles.statusIndicatorText} numberOfLines={1}>
            {booking.status === "pending"
              ? "Finding driver..."
              : booking.status === "accepted"
                ? "Angkol is on the way"
                : booking.status === "arrived"
                  ? "Driver has arrived"
                  : booking.status === "in_progress"
                    ? "On the way to destination"
                    : "Completed"}
          </Text>
        </View>

        <View style={styles.fare}>
          <Text style={styles.fareText}>₱{booking.route.fare}</Text>
        </View>
      </View>

      {/* Cancellation Dialog */}
      <Portal>
        <Modal
          visible={showCancelDialog}
          onDismiss={() => setShowCancelDialog(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking?</Text>

            {booking.status === "accepted" && (
              <Text style={styles.feeWarning}>
                Cancellation fee of ₱20 will apply
              </Text>
            )}

            <Text style={styles.modalSubtitle}>Please select a reason:</Text>

            {CancellationReasons.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  cancellationReason === reason.id &&
                    styles.reasonOptionSelected,
                ]}
                onPress={() => setCancellationReason(reason.id)}
              >
                <Text style={styles.reasonText}>{reason.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setShowCancelDialog(false);
                  setCancellationReason("");
                }}
                style={styles.modalButton}
              >
                Keep Booking
              </Button>
              <Button
                mode="contained"
                onPress={handleCancellation}
                style={[styles.modalButton, styles.cancelConfirmButton]}
                disabled={!cancellationReason}
              >
                Confirm Cancel
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingTop: 30,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    marginHorizontal: 16,
  },
  header: {
    // flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
  },
  locationContainer: {
    flex: 1,
    alignItems: "center",
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  locationTitle: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.text,
    // marginBottom: 4,
  },
  locationDescription: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  content: {
    padding: 16,
  },

  dividerContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 30,
    height: 30,
    position: "abosolute",
    right: 150,
    bottom: 15,
  },
  divider: {
    backgroundColor: colors.gray,
    height: 3,
    width: 3,
    borderRadius: 100,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
  },
  driverInfoSection: {
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  driverDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  driverText: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  driverPhone: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 50,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  vehicleInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
  },
  plateNumber: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
    marginLeft: 8,
  },
  tripDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
  },
  tripItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tripText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  fare: {
    backgroundColor: colors.primary + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fareText: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  cancelButtonText: {
    color: colors.error,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  statusIndicator: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  statusIndicatorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray,
  },
  modalContainer: {
    backgroundColor: colors.background,
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  modalContent: {
    width: "100%",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    marginBottom: 16,
    color: colors.text,
  },
  feeWarning: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.error,
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    marginBottom: 12,
    color: colors.text,
  },
  reasonOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray + "40",
    marginBottom: 8,
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  reasonText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  cancelConfirmButton: {
    backgroundColor: colors.error,
  },
});

export default ActiveBookingCard;
