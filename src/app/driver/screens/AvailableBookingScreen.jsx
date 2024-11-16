// src/app/driver/screens/AvailableBookingsScreen.jsx
import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "@constants/globalStyles";
import { useDriverAuth } from "@context/DriverAuthContext";
import { BookingService } from "@services/bookingService";
import firestore from "@react-native-firebase/firestore";
import { calculateDistance } from "@utils/locationUtils";
import AvailableBookingCard from "@components/driver/AvailableBookingCard";
import { showMessage } from "react-native-flash-message";
import { useNavigation } from "@react-navigation/native";
import AppHeader from "@components/AppHeader";

const AvailableBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { driver } = useDriverAuth();
  const navigation = useNavigation();

  const bookingsSubscription = useRef(null);

  const fetchAvailableBookings = async () => {
    try {
      if (!driver?.uid) return;

      const driverDoc = await firestore()
        .collection("drivers")
        .doc(driver.uid)
        .get();

      const driverLocation = driverDoc.data()?.location;

      if (!driverLocation) {
        console.log("No driver location found");
        return;
      }

      // Cleanup previous subscription
      if (bookingsSubscription.current) {
        bookingsSubscription.current();
      }

      // Get pending bookings
      // const bookingsSnapshot = await firestore()
      //   .collection("bookings")
      //   .where("status", "==", "pending")
      //   .get();

      // Set up real-time listener for pending bookings
      bookingsSubscription.current = firestore()
        .collection("bookings")
        .where("status", "==", "pending")
        .onSnapshot(
          (snapshot) => {
            const availableBookings = [];

            snapshot.forEach((doc) => {
              const booking = doc.data();
              const distance = calculateDistance(
                driverLocation.latitude,
                driverLocation.longitude,
                booking.pickup.coordinates.latitude,
                booking.pickup.coordinates.longitude,
              );

              // Only include bookings within 1km radius
              if (distance <= 1) {
                availableBookings.push({
                  id: doc.id,
                  ...booking,
                  distance,
                });
              }
            });

            // Sort by distance
            availableBookings.sort((a, b) => a.distance - b.distance);
            setBookings(availableBookings);
            setLoading(false);
            setRefreshing(false);
          },
          (error) => {
            console.error("Error watching bookings:", error);
            setLoading(false);
            setRefreshing(false);
          },
        );
    } catch (error) {
      console.error("Error fetching available bookings:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAvailableBookings();
    return () => {
      if (bookingsSubscription.current) {
        bookingsSubscription.current();
      }
    };
  }, [driver?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAvailableBookings();
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      if (!driver?.uid) return;

      // Get booking document
      const bookingDoc = await firestore()
        .collection("bookings")
        .doc(bookingId)
        .get();

      if (!bookingDoc.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();

      // Get passenger data
      const passengerDoc = await firestore()
        .collection("users")
        .doc(bookingData.userId)
        .get();

      if (!passengerDoc.exists) {
        throw new Error("Passenger data not found");
      }

      const passengerData = passengerDoc.data();

      // Start a batch write
      const batch = firestore().batch();

      // Get booking reference
      const bookingRef = firestore().collection("bookings").doc(bookingId);

      // Update booking status and driver info
      batch.update(bookingRef, {
        status: "accepted",
        driverId: driver.uid,
        driverInfo: {
          name: `${driver.firstName} ${driver.lastName}`,
          phoneNumber: driver.phoneNumber,
        },
        passengerInfo: {
          name: `${passengerData.firstName} ${passengerData.lastName}`,
          phoneNumber: passengerData.phoneNumber,
        },
        acceptedAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update driver's current booking and status
      const driverRef = firestore().collection("drivers").doc(driver.uid);
      batch.update(driverRef, {
        currentBookingId: bookingId,
        status: "busy",
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Show success message and navigate
      showMessage({
        message: "Booking Accepted",
        description: "You can now pick up the passenger",
        type: "success",
      });

      // Navigate back to dashboard
      navigation.navigate("Home");
    } catch (error) {
      console.error("Error accepting booking:", error);
      showMessage({
        message: "Error",
        description: "Failed to accept booking. Please try again.",
        type: "error",
      });
    }
  };

  const renderBookingItem = ({ item }) => (
    <AvailableBookingCard
      booking={item}
      onAccept={() => handleAcceptBooking(item.id)}
    />
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading available bookings...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <FlatList
        data={bookings}
        renderItem={renderBookingItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No available bookings nearby</Text>
            <Text style={styles.emptySubText}>
              Pull to refresh to check for new bookings
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  emptySubText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
  },
});

export default AvailableBookingsScreen;
