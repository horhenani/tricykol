// src/components/driver/DriverBookingSheet.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
  // Linking,
  Alert,
  Platform,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import { BookingService, BookingStatus } from "@services/bookingService";
import { showMessage } from "react-native-flash-message";
import firestore from "@react-native-firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useDriverAuth } from "@context/DriverAuthContext";
import * as Linking from "expo-linking";

const DriverBookingSheet = ({
  visible,
  onDismiss,
  booking,
  onPickup,
  loading,
  driverLocation,
}) => {
  const insets = useSafeAreaInsets();
  const [hasArrived, setHasArrived] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const isInProgress = booking?.status === BookingStatus.IN_PROGRESS;
  const [isNearDropoff, setIsNearDropoff] = useState(false);
  const { driver } = useDriverAuth();
  const navigation = useNavigation();

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

  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height),
  ).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const handleChatPress = () => {
    if (!booking?.passengerInfo) return;

    navigation.navigate("Chat", {
      bookingId: booking.id,
      otherUser: {
        id: booking.userId,
        name: booking.passengerInfo.name,
      },
    });
  };

  const handleMessagePress = async () => {
    try {
      // Debug logs
      console.log("Booking:", booking);
      console.log("Passenger Info:", booking?.passengerInfo);
      console.log("Phone Number:", booking?.passengerInfo?.phoneNumber);

      if (!booking?.passengerInfo?.phoneNumber) {
        Alert.alert("Error", "No phone number available for passenger");
        return;
      }

      if (!driver?.firstName) {
        console.log("No driver name available:", driver);
      }

      const phoneNumber = formatPhoneNumber(booking.passengerInfo.phoneNumber);

      if (!phoneNumber) {
        Alert.alert("Error", "Invalid phone number format");
        return;
      }

      // Construct message with driver's name
      const message = encodeURIComponent(
        `Hi Ma'am/Sir! Angkol ${driver?.firstName || ""} po, ang iyong Tricykol driver.`,
      );

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

  const updateToArrived = async () => {
    try {
      if (!booking?.id) return;

      // Use batch update to handle server timestamp properly
      const batch = firestore().batch();
      const bookingRef = firestore().collection("bookings").doc(booking.id);

      batch.update(bookingRef, {
        status: BookingStatus.ARRIVED,
        arrivedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        statusHistory: firestore.FieldValue.arrayUnion({
          status: BookingStatus.ARRIVED,
          timestamp: new Date().toISOString(), // Use ISO string for array
          action: "driver_arrived",
        }),
      });

      await batch.commit();
    } catch (error) {
      console.error("Error updating arrival status:", error);
      showMessage({
        message: "Error",
        description: "Failed to update arrival status",
        type: "error",
      });
    }
  };

  // Check if driver has arrived at pickup location
  useEffect(() => {
    if (!booking || !driverLocation) return;

    const isArrived = BookingService.isDriverArrived(driverLocation, {
      latitude: booking.pickup.latitude,
      longitude: booking.pickup.longitude,
    });

    // Only update status to ARRIVED once when driver first arrives
    if (isArrived && !hasArrived && booking.status === BookingStatus.ACCEPTED) {
      updateToArrived();
    }

    setHasArrived(isArrived);
  }, [driverLocation, booking]);

  // Check if driver has arrived at dropoff location
  useEffect(() => {
    if (
      booking?.status === "in_progress" &&
      driverLocation &&
      booking.dropoff
    ) {
      const isAtDropoff = BookingService.isDriverAtDropoff(driverLocation, {
        latitude: booking.dropoff.latitude,
        longitude: booking.dropoff.longitude,
      });
      setIsNearDropoff(isAtDropoff);
    }
  }, [driverLocation, booking]);

  const handlePickupPress = async () => {
    if (!hasArrived || isUpdating || isInProgress) return;

    setIsUpdating(true);
    try {
      if (!booking?.id || !booking?.driverId) {
        throw new Error("Missing booking or driver information");
      }

      await BookingService.startTrip(booking.id, booking.driverId);

      showMessage({
        message: "Trip Started",
        description: "Have a safe trip!",
        type: "success",
      });

      onDismiss();
    } catch (error) {
      console.error("Error starting trip:", error);
      showMessage({
        message: "Error",
        description: error.message || "Failed to start trip. Please try again.",
        type: "danger",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const result = await BookingService.completeTrip(booking.id, driver.uid);
      showMessage({
        message: "Trip Completed",
        description: `Fare: ₱${result.fare}`,
        type: "success",
      });
      onDismiss();
    } catch (error) {
      console.error("Error completing trip:", error);
      showMessage({
        message: "Error",
        description: error.message || "Failed to complete trip",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: Dimensions.get("window").height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !booking) return null;

  const renderActionButton = () => {
    if (booking.status === "in_progress") {
      return (
        <CustomButton
          title="Complete"
          onPress={handleCompleteTrip}
          disabled={!isNearDropoff || isUpdating}
          loading={isUpdating}
          style={styles.completeButton}
        />
      );
    }

    return (
      <CustomButton
        title={
          isInProgress
            ? "Trip in Progress"
            : hasArrived
              ? "Pick Up"
              : "On The Way..."
        }
        onPress={handlePickupPress}
        disabled={!hasArrived || isUpdating || isInProgress}
        loading={isUpdating}
        style={isInProgress ? styles.inProgressButton : null}
      />
    );
  };

  const renderStatusIndicator = () => {
    if (isInProgress) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.statusIconContainer}>
            <AntDesign name="clockcircleo" size={16} color={colors.primary} />
          </View>

          <Image
            source={require("@assets/logos/tricykol_icon.png")}
            style={{
              width: 24,
              height: 24,
              tintColor: colors.primary,
              resizeMode: "contain",
            }}
          />

          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Trip in Progress</Text>
            <Text style={styles.statusDescription}>
              Heading to drop-off location
            </Text>
          </View>
        </View>
      );
    }

    if (hasArrived) {
      return (
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons
            name="map-marker-check"
            size={24}
            color={colors.success}
          />
          <View style={styles.statusTextContainer}>
            <Text style={styles.statusTitle}>Arrived at Pickup</Text>
            <Text style={styles.statusDescription}>
              Please wait for passenger to board
            </Text>
          </View>
        </View>
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <TouchableWithoutFeedback onPress={onDismiss}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Passenger Info */}
          <View style={styles.passengerSection}>
            <View style={styles.passengerInfo}>
              <MaterialCommunityIcons
                name="account"
                size={32}
                color={colors.text}
              />
              <Text style={styles.passengerName}>
                {booking.passengerInfo.name}
              </Text>
              <Text style={styles.passengerPhone}>
                {formatPhoneNumber(booking.passengerInfo?.phoneNumber)}
              </Text>
            </View>

            {/* Quick action buttons */}
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
                onPress={() => {
                  const phone = formatPhoneNumber(
                    booking.passengerInfo?.phoneNumber,
                  );
                  if (phone) {
                    Linking.openURL(`tel:${phone}`);
                  }
                }}
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

          {/* Locations */}
          <View style={styles.locationsContainer}>
            <View style={styles.locationItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={24}
                color={colors.primary}
              />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Pickup</Text>
                <Text style={styles.locationText}>
                  {booking.pickup.address}
                </Text>
                <Text style={styles.locationDescription}>
                  {booking.pickup.description}
                </Text>
              </View>
            </View>

            <View style={styles.locationDivider} />

            <View style={styles.locationItem}>
              <MaterialCommunityIcons
                name="map-marker-check"
                size={24}
                color={colors.secondary}
              />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Drop-off</Text>
                <Text style={styles.locationText}>
                  {booking.dropoff.address}
                </Text>
                <Text style={styles.locationDescription}>
                  {booking.dropoff.description}
                </Text>
              </View>
            </View>
          </View>

          {/* Fare */}
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fareAmount}>₱{booking.route.fare}</Text>
          </View>

          {/* Action Button */}
          <View style={styles.buttonContainer}>{renderActionButton()}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  passengerSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
    marginBottom: 20,
  },
  passengerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  passengerText: {
    marginLeft: 12,
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  passengerPhone: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  quickActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.background,
    padding: 10,
    elevation: 2,
    borderRadius: 100,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  completeButton: {
  },

  statusIconContainer: {
    position: "relative",
    bottom: 8,
    left: 10,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    margin: 16,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  buttonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  inProgressButton: {
    backgroundColor: colors.primary,
    opacity: 0.8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  handle: {
    width: 0,
    height: 4,
    backgroundColor: colors.gray + "40",
    borderRadius: 2,
    alignSelf: "center",
  },
  closeButton: {
    padding: 4,
  },
  passengerInfo: {
    alignItems: "center",
    // marginBottom: 24,
  },
  passengerName: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 8,
  },
  locationsContainer: {
    marginBottom: 24,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 12,
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
    marginVertical: 4,
  },
  locationDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  locationDivider: {
    height: 1,
    backgroundColor: colors.gray + "20",
    marginVertical: 12,
  },
  fareContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    marginBottom: 24,
  },
  fareLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  fareAmount: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  pickupButton: {
    width: "100%",
  },
});

export default DriverBookingSheet;
