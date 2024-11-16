// src/context/BookingCountContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import firestore from "@react-native-firebase/firestore";
import { useDriverAuth } from "@context/DriverAuthContext";
import { calculateDistance } from "@utils/locationUtils";

const BookingCountContext = createContext({
  availableBookingsCount: 0,
});

export const BookingCountProvider = ({ children }) => {
  const [availableBookingsCount, setAvailableBookingsCount] = useState(0);
  const { driver } = useDriverAuth();

  useEffect(() => {
    let unsubscribe;

    const startListening = async () => {
      if (!driver?.uid) return;

      try {
        // Get driver's location first
        const driverDoc = await firestore()
          .collection("drivers")
          .doc(driver.uid)
          .get();

        const driverLocation = driverDoc.data()?.location;

        if (!driverLocation) return;

        // Listen to pending bookings
        unsubscribe = firestore()
          .collection("bookings")
          .where("status", "==", "pending")
          .onSnapshot((snapshot) => {
            let count = 0;

            snapshot.forEach((doc) => {
              const booking = doc.data();
              const distance = calculateDistance(
                driverLocation.latitude,
                driverLocation.longitude,
                booking.pickup.coordinates.latitude,
                booking.pickup.coordinates.longitude,
              );

              // Only count bookings within 1km radius
              if (distance <= 1) {
                count++;
              }
            });

            setAvailableBookingsCount(count);
          });
      } catch (error) {
        console.error("Error setting up booking count listener:", error);
      }
    };

    startListening();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [driver?.uid]);

  return (
    <BookingCountContext.Provider value={{ availableBookingsCount }}>
      {children}
    </BookingCountContext.Provider>
  );
};

export const useBookingCount = () => {
  const context = useContext(BookingCountContext);
  if (!context) {
    throw new Error(
      "useBookingCount must be used within a BookingCountProvider",
    );
  }
  return context;
};
