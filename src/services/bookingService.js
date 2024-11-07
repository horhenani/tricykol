import firestore from "@react-native-firebase/firestore";

export const BookingStatus = {
  PENDING: "pending", // Just created, waiting for driver
  ACCEPTED: "accepted", // Driver accepted, heading to pickup
  ARRIVED: "arrived", // Driver arrived at pickup point
  IN_PROGRESS: "in_progress", // Trip started
  COMPLETED: "completed", // Trip finished
  CANCELLED: "cancelled", // Cancelled by either party
};

export const BookingService = {
  // Create new booking
  createBooking: async (bookingData) => {
    try {
      const booking = {
        // Basic Info
        id: firestore().collection("bookings").doc().id,
        status: BookingStatus.PENDING,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),

        // Customer Info
        userId: bookingData.userId,
        customerInfo: {
          name: bookingData.passengerInfo.name,
          phone: bookingData.passengerInfo.phone,
        },

        // Locations using GeoPoint
        pickup: {
          coordinates: new firestore.GeoPoint(
            bookingData.pickup.latitude,
            bookingData.pickup.longitude,
          ),
          address: bookingData.pickup.address,
          description: bookingData.pickup.description,
        },
        dropoff: {
          coordinates: new firestore.GeoPoint(
            bookingData.dropoff.latitude,
            bookingData.dropoff.longitude,
          ),
          address: bookingData.dropoff.address,
          description: bookingData.dropoff.description,
        },

        // Trip Details
        route: {
          distance: bookingData.route.distance,
          duration: bookingData.route.duration,
          fare: bookingData.route.fare,
        },

        // Status Timestamps
        statusTimestamps: {
          created: firestore.FieldValue.serverTimestamp(),
        },

        // Area/Region Info (for filtering)
        region: bookingData.region || "paniqui", // or other area identifiers

        // Payment
        payment: {
          method: "cash", // default to cash
          status: "pending",
          fare: bookingData.route.fare,
        },
      };

      // Create booking document
      const bookingRef = firestore().collection("bookings").doc(booking.id);

      // Use batch write for consistency
      const batch = firestore().batch();

      // Add to main bookings collection
      batch.set(bookingRef, booking);

      // Add to user's bookings subcollection
      const userBookingRef = firestore()
        .collection("users")
        .doc(booking.userId)
        .collection("bookings")
        .doc(booking.id);

      batch.set(userBookingRef, {
        bookingId: booking.id,
        status: booking.status,
        createdAt: booking.createdAt,
        pickup: booking.pickup,
        dropoff: booking.dropoff,
        fare: booking.route.fare,
      });

      await batch.commit();
      return booking;
    } catch (error) {
      console.error("Error creating booking:", error);
      throw error;
    }
  },

  // Get active bookings for drivers within a specific region
  getActiveBookingsInRegion: async (region = "paniqui") => {
    try {
      const snapshot = await firestore()
        .collection("bookings")
        .where("status", "==", BookingStatus.PENDING)
        .where("region", "==", region)
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
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
      });
    } catch (error) {
      console.error("Error getting active bookings:", error);
      throw error;
    }
  },

  // Accept booking (for drivers)
  acceptBooking: async (bookingId, driverData) => {
    const acceptedAt = firestore.FieldValue.serverTimestamp();

    try {
      await firestore()
        .collection("bookings")
        .doc(bookingId)
        .update({
          status: BookingStatus.ACCEPTED,
          driverId: driverData.driverId,
          driverInfo: {
            name: driverData.name,
            phone: driverData.phone,
            plateNumber: driverData.plateNumber,
            tricycleDetails: driverData.tricycleDetails,
          },
          "statusTimestamps.accepted": acceptedAt,
          updatedAt: acceptedAt,
        });
    } catch (error) {
      console.error("Error accepting booking:", error);
      throw error;
    }
  },

  // Update booking status with driver location
  updateTripStatus: async (bookingId, status, driverLocation = null) => {
    try {
      const updateData = {
        status,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        [`statusTimestamps.${status}`]: firestore.FieldValue.serverTimestamp(),
      };

      if (driverLocation) {
        updateData.driverLocation = new firestore.GeoPoint(
          driverLocation.latitude,
          driverLocation.longitude,
        );
      }

      await firestore()
        .collection("bookings")
        .doc(bookingId)
        .update(updateData);
    } catch (error) {
      console.error("Error updating trip status:", error);
      throw error;
    }
  },

  // Listen to booking updates (real-time)
  subscribeToBooking: (bookingId, callback) => {
    return firestore()
      .collection("bookings")
      .doc(bookingId)
      .onSnapshot(
        (snapshot) => {
          if (snapshot.exists) {
            const data = snapshot.data();
            // Convert GeoPoints to regular coordinates
            const booking = {
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
            callback(booking);
          }
        },
        (error) => {
          console.error("Error listening to booking:", error);
        },
      );
  },

  // Get user's booking history
  getUserBookingHistory: async (userId, limit = 10) => {
    try {
      const snapshot = await firestore()
        .collection("users")
        .doc(userId)
        .collection("bookings")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting booking history:", error);
      throw error;
    }
  },
};
