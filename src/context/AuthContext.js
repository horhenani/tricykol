import React, { createContext, useState, useContext, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";
import { BookingService } from "@services/bookingService";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await firestore()
            .collection("users")
            .doc(firebaseUser.uid)
            .get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            const fullUserData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              phoneNumber: firebaseUser.phoneNumber,
              ...userData,
            };

            // Set user state and store auth data
            setUser(fullUserData);
            await SecureStore.setItemAsync(
              "tricykol_user_data",
              JSON.stringify(fullUserData),
            );
            const token = await firebaseUser.getIdToken();
            await SecureStore.setItemAsync("tricykol_auth_token", token);

            // Get user's active booking if exists
            if (userData.activeBookingId) {
              // Use BookingService to get and format active booking
              const activeBooking = await BookingService.getActiveBooking(
                firebaseUser.uid,
              );

              // If valid active booking exists, it will be automatically stored
              // in AsyncStorage by BookingService and ready for Dashboard to use
              console.log("Active booking restored:", activeBooking?.id);
            }

            // Update user's last active timestamp
            await firestore().collection("users").doc(firebaseUser.uid).update({
              lastActive: firestore.FieldValue.serverTimestamp(),
            });
          } else {
            setUser(null);
            await Promise.all([
              SecureStore.deleteItemAsync("tricykol_user_data"),
              SecureStore.deleteItemAsync("tricykol_auth_token"),
            ]);
          }
        } else {
          setUser(null);
          await Promise.all([
            SecureStore.deleteItemAsync("tricykol_user_data"),
            SecureStore.deleteItemAsync("tricykol_auth_token"),
          ]);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // useEffect(() => {
  //   const initializeApp = async () => {
  //     try {
  //       // Add this line to request location permission first
  //       // await requestLocationPermission();
  //
  //       // Your existing auth code stays the same
  //       const unsubscribe = auth().onAuthStateChanged(async (user) => {
  //         if (user) {
  //           try {
  //             const userDoc = await firestore()
  //               .collection("users")
  //               .doc(user.uid)
  //               .get();
  //
  //             if (userDoc.exists) {
  //               const userData = userDoc.data();
  //               setUser({ ...user, ...userData });
  //               const token = await user.getIdToken();
  //               await SecureStore.setItemAsync("userToken", token);
  //             } else {
  //               setUser(null);
  //             }
  //           } catch (error) {
  //             console.error("Error fetching user data:", error);
  //             setUser(null);
  //           }
  //         } else {
  //           setUser(null);
  //           await SecureStore.deleteItemAsync("userToken");
  //         }
  //         setLoading(false);
  //       });
  //
  //       return unsubscribe;
  //     } catch (error) {
  //       console.error("Error initializing app:", error);
  //       setLoading(false);
  //     }
  //   };
  //
  //   initializeApp();
  // }, []);

  // useEffect(() => {
  //   const verifySession = async () => {
  //     try {
  //       const token = await SecureStore.getItemAsync("userToken");
  //       if (token && !user) {
  //         const currentUser = auth().currentUser;
  //         if (currentUser) {
  //           const userDoc = await firestore()
  //             .collection("users")
  //             .doc(currentUser.uid)
  //             .get();
  //
  //           if (userDoc.exists) {
  //             setUser({
  //               uid: currentUser.uid,
  //               ...userDoc.data(),
  //             });
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error verifying session:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //
  //   verifySession();
  // }, []);

  const requestLocationPermission = async () => {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        Alert.alert(
          "Location Access Required",
          "Tricykol needs access to your location to connect you with nearby riders. Please enable location services to continue.",
          [
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
        return false;
      }

      if (foregroundStatus === "granted") {
        const { status: backgroundStatus } =
          await Location.requestBackgroundPermissionsAsync();

        if (backgroundStatus !== "granted") {
          Alert.alert(
            "Background Location",
            "For the best experience, please allow background location access.",
            [{ text: "OK" }],
          );
        }
      }

      setLocationPermission(true);
      return true;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  };

  // Helper function to check if user exists in Firestore
  const checkUserExists = async (uid) => {
    try {
      const userDoc = await firestore().collection("users").doc(uid).get();
      return userDoc.exists;
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  };

  // Phone number sign in/registration
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

  // Create new user profile
  const createUserProfile = async (userId, userData) => {
    try {
      await firestore()
        .collection("users")
        .doc(userId)
        .set({
          ...userData,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          status: "active",
        });

      // Update the user state with the new profile data
      setUser({
        uid: userId,
        ...userData,
      });

      // Store auth token
      const currentUser = auth().currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        await SecureStore.setItemAsync("userToken", token);
      }
    } catch (error) {
      console.error("Create profile error:", error);
      throw error;
    }
  };

  // Sign out
  // const signOut = async () => {
  //   try {
  //     await auth().signOut();
  //     await SecureStore.deleteItemAsync("userToken");
  //   } catch (error) {
  //     console.error("Sign out error:", error);
  //     throw error;
  //   }
  // };
  const signOut = async () => {
    try {
      if (user?.uid) {
        // Get current active booking before signing out
        const activeBooking = await BookingService.getActiveBooking(user.uid);

        // If there's an active booking, preserve its state in Firestore
        if (activeBooking?.id) {
          // Update booking status without changing the main status
          await firestore()
            .collection("bookings")
            .doc(activeBooking.id)
            .update({
              lastSignOut: firestore.FieldValue.serverTimestamp(),
              userStatus: "signed_out",
            });

          // DO NOT clear the activeBookingId from user document
          // This ensures the booking is restored on next sign in
        }
      }

      // Clear local storage but keep Firestore state
      await Promise.all([
        SecureStore.deleteItemAsync("tricykol_user_data"),
        SecureStore.deleteItemAsync("tricykol_auth_token"),
        auth().signOut(),
      ]);

      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        locationPermission,
        requestLocationPermission,
        signInWithPhone,
        createUserProfile,
        signOut,
        setUser,
        checkUserExists,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
