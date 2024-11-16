import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookingService } from "@services/bookingService";
import firestore from "@react-native-firebase/firestore";

const BOOKING_KEYS = {
  ACTIVE_BOOKING: "tricykol_active_booking",
  USER_BOOKING: (userId) => `tricykol_booking_${userId}`,
};

const ACTIVE_STATES = ["pending", "accepted", "arrived", "in_progress"];

export const BookingPersistenceService = {
  saveActiveBooking: async (booking, userId) => {
    try {
      if (!userId || !booking) {
        console.warn("Both userId and booking required for persistence");
        return;
      }

      const bookingData = {
        ...booking,
        userId,
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem(
        BOOKING_KEYS.USER_BOOKING(userId),
        JSON.stringify(bookingData),
      );

      // Update user's active booking reference
      await firestore().collection("users").doc(userId).update({
        activeBookingId: booking.id,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving active booking:", error);
    }
  },

  getActiveBooking: async (userId) => {
    try {
      if (!userId) return null;

      // Get user document first
      const userDoc = await firestore().collection("users").doc(userId).get();
      const activeBookingId = userDoc.data()?.activeBookingId;

      if (!activeBookingId) {
        return null;
      }

      // Get booking from Firestore
      const bookingDoc = await firestore()
        .collection("bookings")
        .doc(activeBookingId)
        .get();

      if (!bookingDoc.exists) {
        await BookingPersistenceService.clearActiveBooking(userId);
        return null;
      }

      const bookingData = bookingDoc.data();

      // Check if booking is still active
      if (!ACTIVE_STATES.includes(bookingData.status)) {
        await BookingPersistenceService.clearActiveBooking(userId);
        return null;
      }

      // Format booking data with proper coordinate conversion
      const formattedBooking = {
        id: bookingDoc.id,
        ...bookingData,
        pickup: {
          ...bookingData.pickup,
          latitude: bookingData.pickup.coordinates.latitude,
          longitude: bookingData.pickup.coordinates.longitude,
        },
        dropoff: {
          ...bookingData.dropoff,
          latitude: bookingData.dropoff.coordinates.latitude,
          longitude: bookingData.dropoff.coordinates.longitude,
        },
      };

      // Update local storage
      await AsyncStorage.setItem(
        BOOKING_KEYS.USER_BOOKING(userId),
        JSON.stringify(formattedBooking),
      );

      return formattedBooking;
    } catch (error) {
      console.error("Error getting active booking:", error);
      return null;
    }
  },

  clearActiveBooking: async (userId) => {
    try {
      if (!userId) return;

      // Clear from AsyncStorage
      await AsyncStorage.removeItem(BOOKING_KEYS.USER_BOOKING(userId));

      // Update user document
      await firestore().collection("users").doc(userId).update({
        activeBookingId: null,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error clearing active booking:", error);
    }
  },

  // Subscribe to real-time booking updates and persist
  subscribeToBookingUpdates: (bookingId, userId, callback) => {
    return firestore()
      .collection("bookings")
      .doc(bookingId)
      .onSnapshot(
        async (snapshot) => {
          try {
            if (!snapshot.exists) {
              await BookingPersistenceService.clearActiveBooking(userId);
              callback?.(null);
              return;
            }

            const data = snapshot.data();

            // Format booking data
            const formattedBooking = {
              id: snapshot.id,
              ...data,
              pickup: {
                ...data.pickup,
                latitude: data.pickup.coordinates.latitude,
                longitude: data.pickup.coordinates.longitude,
              },
              dropoff: {
                ...data.dropoff,
                latitude: data.dropoff.coordinates.latitude,
                longitude: data.dropoff.coordinates.longitude,
              },
            };

            if (ACTIVE_STATES.includes(data.status)) {
              await BookingPersistenceService.saveActiveBooking(
                formattedBooking,
                userId,
              );
            } else {
              await BookingPersistenceService.clearActiveBooking(userId);
            }

            callback?.(formattedBooking);
          } catch (error) {
            console.error("Error in booking subscription:", error);
            callback?.(null);
          }
        },
        (error) => {
          console.error("Booking subscription error:", error);
          callback?.(null);
        },
      );
  },
};
