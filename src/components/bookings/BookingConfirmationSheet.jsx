import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Modal,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  BackHandler,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import { BookingService } from "@services/bookingService";
import { useAuth } from "@context/AuthContext";
import { showMessage } from "react-native-flash-message";
import firestore from "@react-native-firebase/firestore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const BookingConfirmationSheet = ({
  visible,
  onDismiss,
  pickup,
  dropoff,
  routeInfo,
  navigation,
}) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [isBooking, setIsBooking] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("Sheet received props:", {
      visible,
      pickup,
      dropoff,
      routeInfo,
    });
  }, [visible, pickup, dropoff, routeInfo]);

  useEffect(() => {
    if (!user?.uid) {
      console.error("No user ID found:", user);
    }
  }, [user]);

  // Handle animations
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
          toValue: SCREEN_HEIGHT,
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

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (visible) {
          handleDismiss();
          return true;
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [visible]);

  const handleConfirmBooking = async () => {
    if (isBooking || !pickup || !dropoff || !routeInfo || !user?.uid) {
      showMessage({
        message: "Invalid Booking Data",
        description: "Please ensure all booking details are provided",
        type: "warning",
      });
      return;
    }

    setIsBooking(true);
    try {
      const bookingData = {
        userId: user.uid,
        pickup: {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          address: pickup.title || "Selected Location",
          description: pickup.description || "",
        },
        dropoff: {
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
          address: dropoff.title || "Selected Location",
          description: dropoff.description || "",
        },
        route: {
          distance: routeInfo.distance,
          duration: routeInfo.duration,
          fare: routeInfo.fare,
          coordinates: routeInfo.coordinates,
        },
        payment: {
          method: "cash",
          status: "pending",
          amount: routeInfo.fare,
        },
        passengerInfo: {
          name:
            user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : "Anonymous",
          phone: user.phoneNumber || "",
        },
        region: "paniqui",
      };

      const booking = await BookingService.createBooking(bookingData);

      // Close sheet first
      handleDismiss();

      // Quick navigate back to dashboard with booking data
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Dashboard",
            params: {
              booking: {
                id: booking.id,
                pickup: {
                  latitude: booking.pickup.latitude,
                  longitude: booking.pickup.longitude,
                  address: booking.pickup.address,
                  description: booking.pickup.description,
                },
                dropoff: {
                  latitude: booking.dropoff.latitude,
                  longitude: booking.dropoff.longitude,
                  address: booking.dropoff.address,
                  description: booking.dropoff.description,
                },
                route: {
                  coordinates: booking.route.coordinates,
                  distance: booking.route.distance,
                  duration: booking.route.duration,
                  fare: booking.route.fare,
                },
                payment: booking.payment,
                status: booking.status,
                passengerInfo: booking.passengerInfo,
              },
            },
          },
        ],
      });

      // Show success message after navigation
      showMessage({
        message: "Booking Created",
        description: "Looking for nearby drivers...",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      showMessage({
        message: "Booking Failed",
        description: error.message || "Please try again",
        type: "danger",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleDismiss = () => {
    if (!isBooking) {
      onDismiss();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet Content */}
        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header - Fixed */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Confirm Booking</Text>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.content}>
              {/* Location Details */}
              <View style={styles.locationContainer}>
                <LocationDetail
                  icon="map-marker"
                  color={colors.primary}
                  title="Pickup Location"
                  location={pickup?.title}
                  description={pickup?.description}
                />
                <View style={styles.routeIndicator} />
                <LocationDetail
                  icon="map-marker-check"
                  color={colors.secondary}
                  title="Drop-off Location"
                  location={dropoff?.title}
                  description={dropoff?.description}
                />
              </View>

              {/* Trip Information */}
              {routeInfo && (
                <View style={styles.tripInfo}>
                  <TripInfoItem
                    icon="map-marker-distance"
                    label="Distance"
                    value={`${routeInfo.distance.toFixed(1)} km`}
                  />
                  <TripInfoItem
                    icon="clock-outline"
                    label="Duration"
                    value={`${Math.ceil(routeInfo.duration)} mins`}
                  />
                  <TripInfoItem
                    icon="cash"
                    label="Fare"
                    value={`₱${routeInfo.fare}`}
                    highlighted
                  />
                </View>
              )}
            </View>
          </ScrollView>

          {/* Actions - Fixed at bottom */}
          <View
            style={[styles.actionsContainer, { paddingBottom: insets.bottom }]}
          >
            <View style={styles.actions}>
              <CustomButton
                title="Cancel"
                onPress={handleDismiss}
                style={styles.cancelButton}
                buttonTextStyle={styles.cancelButtonText}
              />
              <CustomButton
                title="Confirm Booking"
                onPress={handleConfirmBooking}
                loading={isBooking}
                disabled={isBooking || !pickup || !dropoff}
                style={styles.confirmButton}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Helper Components
const LocationDetail = ({ icon, color, title, location, description }) => (
  <View style={styles.locationDetail}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <View style={styles.locationInfo}>
      <Text style={styles.locationLabel}>{title}</Text>
      <Text style={styles.locationText}>{location}</Text>
      <Text style={styles.locationDescription} numberOfLines={1}>
        {description}
      </Text>
    </View>
  </View>
);

const TripInfoItem = ({ icon, label, value, highlighted }) => (
  <View style={styles.tripInfoItem}>
    <MaterialCommunityIcons
      name={icon}
      size={20}
      color={highlighted ? colors.primary : colors.text}
    />
    <View style={styles.tripInfoContent}>
      <Text style={styles.tripInfoLabel}>{label}</Text>
      <Text
        style={[
          styles.tripInfoValue,
          highlighted && { color: colors.primary, fontSize: 18 },
        ]}
      >
        {value}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
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
    minHeight: "70%",
    maxHeight: "90%",
  },
  scrollContent: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray + "40",
    borderRadius: 2,
    marginBottom: 12,
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  content: {
    padding: 20,
  },
  locationContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  locationDetail: {
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
    marginBottom: 2,
  },
  locationText: {
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
    height: 24,
    backgroundColor: colors.gray + "40",
    marginLeft: 12,
    marginVertical: 4,
  },
  tripInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray + "20",
    marginBottom: 20,
  },
  tripInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingRight: 16,
  },
  tripInfoContent: {
    marginLeft: 12,
    flex: 1,
  },
  tripInfoLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.gray,
    marginBottom: 2,
  },
  tripInfoValue: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.gray + "40",
  },
  cancelButtonText: {
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
  },
  actionsContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
});

export default BookingConfirmationSheet;
