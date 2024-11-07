import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { customTheme } from "@constants/globalStyles";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

// Import your screens
import WelcomeScreen from "@public/WelcomeScreen";
import RegisterScreen from "@public/RegisterScreen";
import OtpScreen from "@public/OtpScreen";
import NameStep from "@auth/NameStep";
import BirthDateStep from "@auth/BirthDateStep";
import SexStep from "@auth/SexStep";
import Dashboard from "@app/Dashboard";
import BookingScreen from "@app/bookings/BookingScreen";
import LocationPicker from "@app/bookings/LocationPicker";
import { registerRootComponent } from "expo";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function Navigation() {
  const { user, loading } = useAuth();
  const [loaded, error] = useFonts({
    "Outfit-Black": require("./assets/fonts/Outfit-Black.ttf"),
    "Outfit-Bold": require("./assets/fonts/Outfit-Bold.ttf"),
    "Outfit-ExtraBold": require("./assets/fonts/Outfit-ExtraBold.ttf"),
    "Outfit-ExtraLight": require("./assets/fonts/Outfit-ExtraLight.ttf"),
    "Outfit-Light": require("./assets/fonts/Outfit-Light.ttf"),
    "Outfit-Medium": require("./assets/fonts/Outfit-Medium.ttf"),
    "Outfit-Regular": require("./assets/fonts/Outfit-Regular.ttf"),
    "Outfit-SemiBold": require("./assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Thin": require("./assets/fonts/Outfit-Thin.ttf"),
    "Outfit-VariableFont_wght": require("./assets/fonts/Outfit-VariableFont_wght.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Show nothing while loading fonts or auth state
  if (loading || !loaded || error) {
    return null;
  }

  return (
    <NavigationContainer theme={customTheme}>
      <StatusBar style="light" animated={true} />
      <Stack.Navigator
        initialRouteName={user ? "Dashboard" : "Welcome"}
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          // Authenticated stack
          <>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen
              name="Booking"
              component={BookingScreen}
              options={{
                animation: "fade_from_bottom",
              }}
            />
            <Stack.Screen
              name="LocationPicker"
              component={LocationPicker}
              options={{
                animation: "default",
              }}
            />
          </>
        ) : (
          // Non-authenticated stack
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OtpVerification" component={OtpScreen} />
            <Stack.Screen name="Name" component={NameStep} />
            <Stack.Screen name="Birthdate" component={BirthDateStep} />
            <Stack.Screen name="Sex" component={SexStep} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PaperProvider theme={customTheme}>
          <BottomSheetModalProvider>
            <Navigation />
          </BottomSheetModalProvider>
        </PaperProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);
