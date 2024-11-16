import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { AuthProvider, useAuth } from "@context/AuthContext";
import { customTheme } from "@constants/globalStyles";
import { DriverAuthProvider } from "@context/DriverAuthContext";
import { useDriverAuth } from "@context/DriverAuthContext";
import { BookingCountProvider } from "@context/BookingCountContext";
import FlashMessage from "react-native-flash-message";
import { flashMessageConfig } from "@config/flashMessageConfig";

// import { GestureHandlerRootView } from "react-native-gesture-handler";
// import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

// authentications
import WelcomeScreen from "@public/WelcomeScreen";
import RegisterScreen from "@public/RegisterScreen";
import OtpScreen from "@public/OtpScreen";
import NameStep from "@auth/NameStep";
import BirthDateStep from "@auth/BirthDateStep";
import SexStep from "@auth/SexStep";

// driver auth screens
import DriverRegisterScreen from "@public/driver/DriverRegisterScreen";
import DriverOtpScreen from "@public/driver/DriverOtpScreen";
import DriverNameStep from "@auth/driver/DriverNameStep";
import DriverBirthDateStep from "@auth/driver/DriverBirthDateStep";
import DriverSexStep from "@auth/driver/DriverSexStep";
import DriverDrawerNavigator from "@app/driver/screens/DriverDrawerNavigator";

// passenger

import Dashboard from "@app/Dashboard";
import BookingScreen from "@app/bookings/BookingScreen";
import LocationPicker from "@app/bookings/LocationPicker";
import PassengerDrawerNavigator from "@app/passenger/PassengerDrawerNavigator";

// driver
// import DriverDashboard from "@app/driver/DriverDashboard";
// import DriverTabNavigator from "@app/driver/screens/DriverTabNavigator";

import { registerRootComponent } from "expo";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

function Navigation() {
  const { user, loading: authLoading } = useAuth();
  const { driver, loading: driverLoading } = useDriverAuth();
  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
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
    async function prepare() {
      try {
        // Keep splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();

        // Wait for both auth states and fonts to be ready
        if (!authLoading && !driverLoading && (fontsLoaded || fontError)) {
          setIsReady(true);
          await SplashScreen.hideAsync();
        }
      } catch (e) {
        console.warn(e);
      }
    }

    prepare();
  }, [fontsLoaded, fontError, authLoading, driverLoading]);

  if (!isReady) {
    return null;
  }

  const getInitialRoute = () => {
    if (driver) return "DriverTabs";
    if (user) return "Dashboard";
    return "Welcome";
  };

  const AuthNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OtpVerification" component={OtpScreen} />
      <Stack.Screen name="Name" component={NameStep} />
      <Stack.Screen name="Birthdate" component={BirthDateStep} />
      <Stack.Screen name="Sex" component={SexStep} />
      <Stack.Screen name="DriverRegister" component={DriverRegisterScreen} />
      <Stack.Screen name="DriverOtpVerification" component={DriverOtpScreen} />
      <Stack.Screen name="DriverNameStep" component={DriverNameStep} />
      <Stack.Screen name="DriverBirthdate" component={DriverBirthDateStep} />
      <Stack.Screen name="DriverSex" component={DriverSexStep} />
    </Stack.Navigator>
  );

  const PassengerNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="PassengerDrawer"
        component={PassengerDrawerNavigator}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ animation: "fade_from_bottom" }}
      />
      <Stack.Screen
        name="LocationPicker"
        component={LocationPicker}
        options={{ animation: "default" }}
      />
    </Stack.Navigator>
  );

  // const DriverNavigator = () => (
  //   <Stack.Navigator screenOptions={{ headerShown: false }}>
  //     <Stack.Screen name="DriverTabs" component={DriverTabNavigator} />
  //   </Stack.Navigator>
  // );

  const DriverNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverDrawer" component={DriverDrawerNavigator} />
    </Stack.Navigator>
  );

  const renderNavigator = () => {
    if (driver) {
      return <DriverNavigator />;
    }
    if (user) {
      return <PassengerNavigator />;
    }
    return <AuthNavigator />;
  };

  return (
    <NavigationContainer theme={customTheme}>
      <StatusBar style="light" animated={true} />
      {renderNavigator()}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DriverAuthProvider>
        <BookingCountProvider>
          <SafeAreaProvider>
            <PaperProvider theme={customTheme}>
              <Navigation />
              <FlashMessage {...flashMessageConfig} />
            </PaperProvider>
          </SafeAreaProvider>
        </BookingCountProvider>
      </DriverAuthProvider>
    </AuthProvider>
  );
}

registerRootComponent(App);
