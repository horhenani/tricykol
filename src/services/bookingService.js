import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BOOKING_STORAGE_KEY = (userId) => `tricykol_booking_${userId}`;
const ACTIVE_STATES = ["pending", "accepted", "arrived", "in_progress"];

export const BookingStatus = {
  PENDING: "pending", // Just created, waiting for driver
  ACCEPTED: "accepted", // Driver accepted, heading to pickup
  ARRIVED: "arrived", // Driver arrived at pickup point
  IN_PROGRESS: "in_progress", // Trip started
  COMPLETED: "completed", // Trip finished
  CANCELLED: "cancelled", // Cancelled by either party
};

export const PaymentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
};

export const PaymentMethods = {
  CASH: "cash",
  EWALLET: "ewallet",
};

const formatUserInfo = (userData) => ({
  name: `${userData.firstName} ${userData.lastName}`,
  phoneNumber: userData.phoneNumber || null,
  email: userData.email || null,
});

// Helper function to format location data
const formatLocationData = (location) => ({
  ...location,
  coordinates: new firestore.GeoPoint(location.latitude, location.longitude),
});

export const BookingService = {
  // Create new booking
  createBooking: async (bookingData) => {
    try {
      if (!bookingData.userId) {
        throw new Error("User ID is required");
      }

      // Get user data for passenger info
      const userDoc = await firestore()
        .collection("users")
        .doc(bookingData.userId)
        .get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const timestamp = new Date().toISOString(); // For array elements

      // Create booking object with consistent structure
      const booking = {
        id: firestore().collection("bookings").doc().id,
        status: BookingStatus.PENDING,
        createdAt: firestore.FieldValue.serverTimestamp(), // For document fields
        updatedAt: firestore.FieldValue.serverTimestamp(),
        userId: bookingData.userId,
        region: bookingData.region || "paniqui",

        // Passenger information
        passengerInfo: {
          name: `${userData.firstName} ${userData.lastName}`,
          phoneNumber: userData.phoneNumber || null,
        },

        // Location data
        pickup: {
          ...bookingData.pickup,
          coordinates: new firestore.GeoPoint(
            bookingData.pickup.latitude,
            bookingData.pickup.longitude,
          ),
        },
        dropoff: {
          ...bookingData.dropoff,
          coordinates: new firestore.GeoPoint(
            bookingData.dropoff.latitude,
            bookingData.dropoff.longitude,
          ),
        },

        // Route information
        route: {
          ...bookingData.route,
          coordinates: bookingData.route.coordinates.map((coord) => ({
            latitude: coord.latitude,
            longitude: coord.longitude,
          })),
        },

        // Payment information
        payment: {
          method: bookingData.payment?.method || PaymentMethods.CASH,
          status: PaymentStatus.PENDING,
          amount: bookingData.route.fare,
          currency: "PHP",
        },

        // Status tracking history - use regular timestamp for array
        statusHistory: [
          {
            status: BookingStatus.PENDING,
            timestamp: timestamp, // Use ISO string timestamp for array element
            action: "booking_created",
          },
        ],

        // Driver information (will be updated when accepted)
        driverId: null,
        driverInfo: null,

        // Timestamps for tracking
        acceptedAt: null,
        arrivedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
      };

      // Use batch write for consistency
      const batch = firestore().batch();

      // Add to main bookings collection
      const bookingRef = firestore().collection("bookings").doc(booking.id);
      batch.set(bookingRef, booking);

      // Update user's booking reference
      const userRef = firestore().collection("users").doc(booking.userId);
      batch.update(userRef, {
        activeBookingId: booking.id,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();

      // Save to local storage for persistence
      const persistedBooking = {
        ...booking,
        pickup: {
          ...booking.pickup,
          latitude: booking.pickup.coordinates.latitude,
          longitude: booking.pickup.coordinates.longitude,
        },
        dropoff: {
          ...booking.dropoff,
          latitude: booking.dropoff.coordinates.latitude,
          longitude: booking.dropoff.coordinates.longitude,
        },
      };

      await AsyncStorage.setItem(
        BOOKING_STORAGE_KEY(booking.userId),
        JSON.stringify(persistedBooking),
      );

      return persistedBooking;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // Get active booking - Core function for restoration
  getActiveBooking: async (userId) => {
    try {
      if (!userId) return null;

      // Get user document
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
        await BookingService.clearActiveBooking(userId);
        return null;
      }

      const bookingData = bookingDoc.data();

      // Only restore active bookings
      if (!ACTIVE_STATES.includes(bookingData.status)) {
        await BookingService.clearActiveBooking(userId);
        return null;
      }

      // Format booking data
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
        BOOKING_STORAGE_KEY(userId),
        JSON.stringify(formattedBooking),
      );

      return formattedBooking;
    } catch (error) {
      console.error("Error getting active booking:", error);
      return null;
    }
  },

  // Subscribe to booking updates
  subscribeToBookingUpdates: (bookingId, userId, callback) => {
    if (!bookingId || !userId) return () => {};

    return firestore()
      .collection("bookings")
      .doc(bookingId)
      .onSnapshot(
        async (snapshot) => {
          try {
            if (!snapshot.exists) {
              await BookingService.clearActiveBooking(userId);
              callback?.(null);
              return;
            }

            const data = snapshot.data();

            // If booking is cancelled or completed, clean up and return null
            if (!ACTIVE_STATES.includes(data.status)) {
              await BookingService.clearActiveBooking(userId);
              callback?.(null);
              return;
            }

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

            await AsyncStorage.setItem(
              BOOKING_STORAGE_KEY(userId),
              JSON.stringify(formattedBooking),
            );

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

  // Clear active booking
  clearActiveBooking: async (userId) => {
    try {
      if (!userId) {
        console.warn("No userId provided to clearActiveBooking");
        return;
      }

      // Use Promise.allSettled instead of Promise.all to handle partial failures
      const results = await Promise.allSettled([
        // Clear from AsyncStorage
        AsyncStorage.removeItem(BOOKING_STORAGE_KEY(userId)),

        // Update Firestore - wrapped in try/catch
        (async () => {
          try {
            await firestore().collection("users").doc(userId).update({
              activeBookingId: null,
              lastUpdated: firestore.FieldValue.serverTimestamp(),
            });
          } catch (firestoreError) {
            console.error("Firestore update error:", firestoreError);
          }
        })(),
      ]);

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to clear booking (operation ${index}):`,
            result.reason,
          );
        }
      });
    } catch (error) {
      console.error("Error in clearActiveBooking:", error);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (bookingId, userId, reason) => {
    try {
      if (!bookingId || !userId) {
        throw new Error("Booking ID and User ID are required");
      }

      // Get booking reference
      const bookingRef = firestore().collection("bookings").doc(bookingId);
      const bookingDoc = await bookingRef.get();

      if (!bookingDoc.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();

      // Check if booking is already cancelled
      if (bookingData.status === BookingStatus.CANCELLED) {
        console.log("Booking is already cancelled");
        return;
      }

      // Check if booking can be cancelled
      if (!["pending", "accepted"].includes(bookingData.status)) {
        throw new Error(`Cannot cancel booking in ${bookingData.status} state`);
      }

      // Create batch operation
      const batch = firestore().batch();

      // Update booking document
      batch.update(bookingRef, {
        status: BookingStatus.CANCELLED,
        cancellationDetails: {
          cancelledBy: "user",
          reason,
          timestamp: firestore.FieldValue.serverTimestamp(),
        },
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Update user document
      const userRef = firestore().collection("users").doc(userId);
      batch.update(userRef, {
        activeBookingId: null,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      });

      // Execute batch
      await batch.commit();

      // Clear local storage
      await AsyncStorage.removeItem(BOOKING_STORAGE_KEY(userId));

      // Return true to indicate success
      return true;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  },

  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  },

  // Check if driver has arrived (within 50 meters of pickup)
  isDriverArrived: (driverLocation, pickupLocation, threshold = 0.05) => {
    if (!driverLocation || !pickupLocation) return false;

    const distance = BookingService.calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      pickupLocation.latitude,
      pickupLocation.longitude,
    );

    return distance <= threshold; // 0.05 km = 50 meters
  },

  // updateBookingStatus: async (bookingId, newStatus, additionalData = {}) => {
  //   try {
  //     if (!bookingId) throw new Error("Booking ID is required");
  //
  //     const timestamp = firestore.FieldValue.serverTimestamp();
  //
  //     await firestore()
  //       .collection("bookings")
  //       .doc(bookingId)
  //       .update({
  //         status: newStatus,
  //         updatedAt: timestamp,
  //         ...additionalData,
  //         statusHistory: firestore.FieldValue.arrayUnion({
  //           status: newStatus,
  //           timestamp: timestamp,
  //           ...additionalData,
  //         }),
  //       });
  //
  //     return true;
  //   } catch (error) {
  //     console.error("Error updating booking status:", error);
  //     throw error;
  //   }
  // },

  updateBookingStatus: async (bookingId, newStatus, additionalData = {}) => {
    try {
      if (!bookingId) throw new Error("Booking ID is required");

      // Create timestamp for status history
      const currentTimestamp = new Date().toISOString();

      // Extract any server timestamp fields from additionalData
      const { arrivedAt, ...otherData } = additionalData;

      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        ...otherData,
        statusHistory: firestore.FieldValue.arrayUnion({
          status: newStatus,
          timestamp: currentTimestamp,
          ...otherData,
        }),
      };

      // Add server timestamp fields if they exist
      if (arrivedAt === firestore.FieldValue.serverTimestamp()) {
        updateData.arrivedAt = firestore.FieldValue.serverTimestamp();
      }

      await firestore()
        .collection("bookings")
        .doc(bookingId)
        .update(updateData);

      return true;
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw error;
    }
  },

  startTrip: async (bookingId, driverId) => {
    try {
      if (!bookingId || !driverId) {
        throw new Error("Booking ID and Driver ID are required");
      }

      const timestamp = firestore.FieldValue.serverTimestamp();

      // Create batch write for consistency
      const batch = firestore().batch();

      // Update booking document
      const bookingRef = firestore().collection("bookings").doc(bookingId);
      batch.update(bookingRef, {
        status: "in_progress",
        tripStartTime: timestamp,
        updatedAt: timestamp,
        statusHistory: firestore.FieldValue.arrayUnion({
          status: BookingStatus.IN_PROGRESS,
          timestamp: new Date().toISOString(), // Use actual date for array union
          action: "trip_started",
        }),
      });

      // Update driver status
      const driverRef = firestore().collection("drivers").doc(driverId);
      batch.update(driverRef, {
        status: "busy",
        currentTripStarted: timestamp,
        lastUpdated: timestamp,
      });

      // Commit both updates
      await batch.commit();

      return true;
    } catch (error) {
      console.error("Error starting trip:", error);
      throw new Error(`Failed to start trip: ${error.message}`);
    }
  },

  completeTrip: async (bookingId, driverId) => {
    try {
      if (!bookingId || !driverId) {
        throw new Error("Booking ID and Driver ID are required");
      }

      const timestamp = firestore.FieldValue.serverTimestamp();
      const batch = firestore().batch();

      // Get booking reference
      const bookingRef = firestore().collection("bookings").doc(bookingId);
      const bookingDoc = await bookingRef.get();

      if (!bookingDoc.exists) {
        throw new Error("Booking not found");
      }

      const bookingData = bookingDoc.data();

      // Verify booking status
      if (bookingData.status !== "in_progress") {
        throw new Error("Booking must be in progress to complete");
      }

      // Update booking status
      batch.update(bookingRef, {
        status: "completed",
        completedAt: timestamp,
        updatedAt: timestamp,
        statusHistory: firestore.FieldValue.arrayUnion({
          status: "completed",
          timestamp: new Date().toISOString(),
          action: "trip_completed",
        }),
      });

      // Update driver status
      const driverRef = firestore().collection("drivers").doc(driverId);
      batch.update(driverRef, {
        status: "online", // Set back to online
        currentBookingId: null,
        currentTripEnded: timestamp,
        lastUpdated: timestamp,
        statistics: {
          totalTrips: firestore.FieldValue.increment(1),
          completedTrips: firestore.FieldValue.increment(1),
          earnings: {
            total: firestore.FieldValue.increment(bookingData.route.fare),
            today: firestore.FieldValue.increment(bookingData.route.fare),
          },
        },
      });

      // Update passenger document
      if (bookingData.userId) {
        const userRef = firestore().collection("users").doc(bookingData.userId);
        batch.update(userRef, {
          activeBookingId: null,
          lastUpdated: timestamp,
        });
      }

      // Commit all updates
      await batch.commit();

      return {
        success: true,
        fare: bookingData.route.fare,
      };
    } catch (error) {
      console.error("Error completing trip:", error);
      throw new Error(`Failed to complete trip: ${error.message}`);
    }
  },

  isDriverAtDropoff: (driverLocation, dropoffLocation, threshold = 0.05) => {
    if (!driverLocation || !dropoffLocation) return false;

    const distance = BookingService.calculateDistance(
      driverLocation.latitude,
      driverLocation.longitude,
      dropoffLocation.latitude,
      dropoffLocation.longitude,
    );

    return distance <= threshold; // 0.05 km = 50 meters
  },
};

const deg2rad = (deg) => deg * (Math.PI / 180);
