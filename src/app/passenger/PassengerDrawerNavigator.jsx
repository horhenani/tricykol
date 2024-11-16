import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { StyleSheet } from "react-native";
import { colors, fonts } from "@constants/globalStyles";
import CustomPassengerDrawerContent from "@app/passenger/CustomPassengerDrawerContent";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Import screens
import Dashboard from "@app/Dashboard";
import PassengerProfileScreen from "@app/passenger/PassengerProfileScreen";
import PassengerHistoryScreen from "@app/passenger/PassengerHistoryScreen";
import PassengerPaymentsScreen from "@app/passenger/PassengerPaymentsScreen";
import PassengerSettingsScreen from "@app/passenger/PassengerSettingsScreen";

const Drawer = createDrawerNavigator();

const PassengerDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomPassengerDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: styles.drawerStyle,
        drawerType: "front",
        overlayColor: "rgba(0,0,0,0.7)",
        drawerLabelStyle: styles.drawerLabel,
        drawerActiveBackgroundColor: colors.primary + "20",
        drawerActiveTintColor: colors.text,
        drawerInactiveTintColor: colors.gray,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={Dashboard}
        options={{
          title: "Home",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="home-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="PassengerProfile"
        component={PassengerProfileScreen}
        options={{
          title: "Profile",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="account-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="PassengerHistory"
        component={PassengerHistoryScreen}
        options={{
          title: "Trip History",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="PassengerPayments"
        component={PassengerPaymentsScreen}
        options={{
          title: "Payments",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="wallet-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="PassengerSettings"
        component={PassengerSettingsScreen}
        options={{
          title: "Settings",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerStyle: {
    backgroundColor: colors.background,
    width: 320,
  },
  drawerLabel: {
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: -16,
  },
});

export default PassengerDrawerNavigator;
