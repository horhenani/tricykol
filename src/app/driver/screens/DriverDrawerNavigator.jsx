// src/navigation/DriverDrawerNavigator.jsx
import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { StyleSheet } from "react-native";
import { colors, fonts } from "@constants/globalStyles";
import CustomDrawerContent from "@components/driver/CustomDrawerContent";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Import screens
import DriverTabNavigator from "@app/driver/screens/DriverTabNavigator";
import DriverProfileScreen from "@app/driver/screens/DriverProfileScreen";
import DriverEarningsScreen from "@app/driver/screens/DriverEarningsScreen";
import DriverHistoryScreen from "@app/driver/screens/DriverHistoryScreen";
import DriverSettingsScreen from "@app/driver/screens/DriverSettingsScreen";

const Drawer = createDrawerNavigator();

const DriverDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
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
        name="DriverHome"
        component={DriverTabNavigator}
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
        name="DriverProfile"
        component={DriverProfileScreen}
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
        name="DriverEarnings"
        component={DriverEarningsScreen}
        options={{
          title: "Earnings",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="cash" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="DriverHistory"
        component={DriverHistoryScreen}
        options={{
          title: "Trip History",
          drawerIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="DriverSettings"
        component={DriverSettingsScreen}
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

export default DriverDrawerNavigator;
