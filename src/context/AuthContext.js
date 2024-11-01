import React, { createContext, useState, useContext, useEffect } from "react";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import { Alert, Linking, Platform } from "react-native";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState(false);

  // Handle user state changes
  // useEffect(() => {
  //   const unsubscribe = auth().onAuthStateChanged(async (user) => {
  //     if (user) {
  //       try {
  //         // Get user profile data from Firestore
  //         const userDoc = await firestore()
  //           .collection("users")
  //           .doc(user.uid)
  //           .get();
  //
  //         if (userDoc.exists) {
  //           const userData = userDoc.data();
  //           // Store user data in state
  //           setUser({ ...user, ...userData });
  //           // Store auth token securely
  //           const token = await user.getIdToken();
  //           await SecureStore.setItemAsync("userToken", token);
  //         } else {
  //           // If no Firestore profile exists, keep auth state but don't set user data
  //           setUser(null);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching user data:", error);
  //         setUser(null);
  //       }
  //     } else {
  //       setUser(null);
  //       await SecureStore.deleteItemAsync("userToken");
  //     }
  //     setLoading(false);
  //   });
  //
  //   return unsubscribe;
  // }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Add this line to request location permission first
        // await requestLocationPermission();

        // Your existing auth code stays the same
        const unsubscribe = auth().onAuthStateChanged(async (user) => {
          if (user) {
            try {
              const userDoc = await firestore()
                .collection("users")
                .doc(user.uid)
                .get();

              if (userDoc.exists) {
                const userData = userDoc.data();
                setUser({ ...user, ...userData });
                const token = await user.getIdToken();
                await SecureStore.setItemAsync("userToken", token);
              } else {
                setUser(null);
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
              setUser(null);
            }
          } else {
            setUser(null);
            await SecureStore.deleteItemAsync("userToken");
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error initializing app:", error);
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

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
  const signOut = async () => {
    try {
      await auth().signOut();
      await SecureStore.deleteItemAsync("userToken");
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
