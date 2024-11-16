// src/context/DriverAuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import useLocationService from "@services/useLocationService";

const DriverAuthContext = createContext({});

const STORAGE_KEYS = {
  DRIVER_DATA: "tricykol_driver_data",
  DRIVER_TOKEN: "tricykol_driver_token",
};

export const DriverAuthProvider = ({ children }) => {
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const locationService = useLocationService();
  const [locationWatcher, setLocationWatcher] = useState(null);

  // Add location tracking for driver
  const startDriverLocationTracking = async () => {
    try {
      // Check permissions first
      const hasPermission = await locationService.checkLocationPermission();
      const isEnabled = await locationService.checkLocationEnabled();

      if (!hasPermission || !isEnabled || !driver?.uid) {
        return false;
      }

      // Clear existing watcher if any
      if (locationWatcher) {
        locationWatcher.remove();
      }

      // Start watching location
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        async (newLocation) => {
          if (!driver?.uid) return;

          try {
            // Update driver's location in Firestore
            await firestore()
              .collection("drivers")
              .doc(driver.uid)
              .update({
                location: new firestore.GeoPoint(
                  newLocation.coords.latitude,
                  newLocation.coords.longitude,
                ),
                lastLocationUpdate: firestore.FieldValue.serverTimestamp(),
                heading: newLocation.coords.heading || 0,
                speed: newLocation.coords.speed || 0,
              });
          } catch (error) {
            console.error("Error updating driver location:", error);
          }
        },
      );

      setLocationWatcher(subscription);
      return true;
    } catch (error) {
      console.error("Error starting location tracking:", error);
      return false;
    }
  };

  // Stop location tracking
  const stopDriverLocationTracking = async () => {
    try {
      if (locationWatcher) {
        await locationWatcher.remove();
        setLocationWatcher(null);
      }

      // Update driver's last known location
      if (driver?.uid) {
        await firestore().collection("drivers").doc(driver.uid).update({
          lastLocationUpdate: firestore.FieldValue.serverTimestamp(),
          status: "offline",
        });
      }
    } catch (error) {
      console.error("Error stopping location tracking:", error);
    }
  };

  // Fetch both user and driver data
  const fetchDriverData = async (userId) => {
    const [userDoc, driverDoc] = await Promise.all([
      firestore().collection("users").doc(userId).get(),
      firestore().collection("drivers").doc(userId).get(),
    ]);

    if (!userDoc.exists || !driverDoc.exists) {
      throw new Error("Incomplete driver profile");
    }

    const userData = userDoc.data();
    const driverData = driverDoc.data();

    return {
      uid: userId,
      // Basic user info
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      birthDate: userData.birthDate,
      sex: userData.sex,
      type: "driver",
      // Driver specific data
      driverProfile: {
        ...driverData,
        userId,
      },
    };
  };

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Check both collections
          const [userDoc, driverDoc] = await Promise.all([
            firestore().collection("users").doc(firebaseUser.uid).get(),
            firestore().collection("drivers").doc(firebaseUser.uid).get(),
          ]);

          if (userDoc.exists && driverDoc.exists) {
            const fullDriverData = await fetchDriverData(firebaseUser.uid);

            // Set driver state
            setDriver(fullDriverData);

            // Store auth data
            await Promise.all([
              SecureStore.setItemAsync(
                STORAGE_KEYS.DRIVER_DATA,
                JSON.stringify(fullDriverData),
              ),
              SecureStore.setItemAsync(
                STORAGE_KEYS.DRIVER_TOKEN,
                await firebaseUser.getIdToken(),
              ),
            ]);

            // Update driver's last active timestamp
            await firestore()
              .collection("drivers")
              .doc(firebaseUser.uid)
              .update({
                lastActive: firestore.FieldValue.serverTimestamp(),
                updatedAt: firestore.FieldValue.serverTimestamp(),
              });
          } else {
            await clearDriverData();
          }
        } else {
          await clearDriverData();
        }
      } catch (error) {
        console.error("Error in driver auth state change:", error);
        await clearDriverData();
      } finally {
        setLoading(false);
      }
    });

    // Initial check for stored driver data
    checkStoredDriverData();

    return unsubscribe;
  }, []);

  const checkStoredDriverData = async () => {
    try {
      const storedData = await SecureStore.getItemAsync(
        STORAGE_KEYS.DRIVER_DATA,
      );
      const storedToken = await SecureStore.getItemAsync(
        STORAGE_KEYS.DRIVER_TOKEN,
      );

      if (storedData && storedToken) {
        const parsedData = JSON.parse(storedData);

        // Verify data in both collections
        const freshData = await fetchDriverData(parsedData.uid);
        setDriver(freshData);
      }
    } catch (error) {
      console.error("Error checking stored driver data:", error);
      await clearDriverData();
    }
  };

  const clearDriverData = async () => {
    setDriver(null);
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.DRIVER_DATA),
      SecureStore.deleteItemAsync(STORAGE_KEYS.DRIVER_TOKEN),
    ]);
  };

  const signInWithPhone = async (phoneNumber) => {
    try {
      const formattedNumber = `+63${phoneNumber.replace(/[^0-9]/g, "")}`;
      const confirmation = await auth().signInWithPhoneNumber(formattedNumber);
      return confirmation;
    } catch (error) {
      console.error("Phone sign in error:", error);
      throw error;
    }
  };

  const createDriverProfile = async (userId, userData) => {
    try {
      const timestamp = firestore.FieldValue.serverTimestamp();
      const batch = firestore().batch();

      // User collection - basic profile
      const userDoc = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phoneNumber,
        birthDate: userData.birthDate,
        sex: userData.sex,
        type: "driver",
        createdAt: timestamp,
        updatedAt: timestamp,
        status: "active",
      };

      // Drivers collection - operational data
      const driverDoc = {
        userId,
        status: "offline", // Initial driver status
        isVerified: false, // Will be updated by admin after document verification
        rating: 5.0,
        totalRides: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        lastActive: timestamp,
        // Basic driver operational data
        location: null,
        lastLocationUpdate: null,
        currentBookingId: null,
        earnings: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
        },
        statistics: {
          acceptanceRate: 100,
          completionRate: 100,
          totalTrips: 0,
          cancelledTrips: 0,
        },
        // Empty vehicle info - to be filled by admin
        vehicleInfo: {
          plateNumber: null,
          verified: false,
        },
        // Empty documents section - to be filled by admin
        documents: {
          license: {
            number: null,
            verified: false,
            verifiedAt: null,
          },
          registration: {
            number: null,
            verified: false,
            verifiedAt: null,
          },
        },
      };

      // Batch write
      batch.set(firestore().collection("users").doc(userId), userDoc);
      batch.set(firestore().collection("drivers").doc(userId), driverDoc);

      await batch.commit();

      // Combine data for local state
      const fullDriverData = {
        uid: userId,
        ...userDoc,
        driverProfile: {
          ...driverDoc,
          userId,
        },
      };

      // Update state and storage
      setDriver(fullDriverData);
      await SecureStore.setItemAsync(
        STORAGE_KEYS.DRIVER_DATA,
        JSON.stringify(fullDriverData),
      );

      // Get and store fresh token
      if (auth().currentUser) {
        const token = await auth().currentUser.getIdToken();
        await SecureStore.setItemAsync(STORAGE_KEYS.DRIVER_TOKEN, token);
      }

      return fullDriverData;
    } catch (error) {
      console.error("Error creating driver profile:", error);
      throw error;
    }
  };

  const updateDriverStatus = async (status) => {
    if (!driver?.uid) return;

    try {
      await firestore().collection("drivers").doc(driver.uid).update({
        status,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      // Start or stop location tracking based on status
      if (status === "online") {
        await startDriverLocationTracking();
      } else {
        await stopDriverLocationTracking();
      }

      setDriver((prev) => ({
        ...prev,
        driverProfile: {
          ...prev.driverProfile,
          status,
        },
      }));
    } catch (error) {
      console.error("Error updating driver status:", error);
      throw error;
    }
  };

  const checkDriverExists = async (uid) => {
    try {
      const [userDoc, driverDoc] = await Promise.all([
        firestore().collection("users").doc(uid).get(),
        firestore().collection("drivers").doc(uid).get(),
      ]);

      // Check both documents exist and user type is driver
      return (
        userDoc.exists && driverDoc.exists && userDoc.data()?.type === "driver"
      );
    } catch (error) {
      console.error("Error checking driver existence:", error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      await stopDriverLocationTracking();

      if (driver?.uid) {
        await firestore().collection("drivers").doc(driver.uid).update({
          status: "offline",
          lastActive: firestore.FieldValue.serverTimestamp(),
        });
      }

      await auth().signOut();
      await clearDriverData();
    } catch (error) {
      console.error("Driver sign out error:", error);
      throw error;
    }
  };

  useEffect(() => {
    return () => {
      if (locationWatcher) {
        locationWatcher.remove();
      }
    };
  }, []);

  // Expose location service methods and state
  const locationContext = {
    ...locationService,
    startDriverLocationTracking,
    stopDriverLocationTracking,
  };

  return (
    <DriverAuthContext.Provider
      value={{
        driver,
        loading,
        signInWithPhone,
        createDriverProfile,
        updateDriverStatus,
        signOut,
        checkStoredDriverData,
        checkDriverExists,
        ...locationContext,
      }}
    >
      {children}
    </DriverAuthContext.Provider>
  );
};

export const useDriverAuth = () => {
  const context = useContext(DriverAuthContext);
  if (!context) {
    throw new Error("useDriverAuth must be used within a DriverAuthProvider");
  }
  return context;
};
