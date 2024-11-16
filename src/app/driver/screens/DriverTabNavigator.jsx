// src/app/driver/DriverTabNavigator.jsx

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import { Image, StyleSheet, View, Text } from "react-native";
import { useBookingCount } from "@context/BookingCountContext";

// Import screens
import HomeScreen from "@app/driver/screens/HomeScreen";
import AvailableBookingsScreen from "@app/driver/screens/AvailableBookingScreen";

const Tab = createBottomTabNavigator();

const DriverTabNavigator = () => {
  const { availableBookingsCount } = useBookingCount();

  const TabBarIcon = ({ icon, isFocused, badgeCount }) => (
    <View style={styles.iconContainer}>
      {icon}
      {badgeCount > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.gray + "20",
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 12,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-variant"
              size={size}
              color={color}
            />
          ),
          tabBarLabel: "Home",
        }}
      />
      <Tab.Screen
        name="AvailableBookings"
        component={AvailableBookingsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              icon={
                <Image
                  source={require("@assets/logos/tricykol_icon.png")}
                  style={{
                    width: 24,
                    height: 24,
                    tintColor: focused ? colors.primary : colors.gray,
                    resizeMode: "contain",
                  }}
                />
              }
              isFocused={focused}
              badgeCount={availableBookingsCount}
            />
          ),
          tabBarLabel: "Available Rides",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: -8,
    right: -12,
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.background,
    fontSize: 10,
    fontFamily: fonts.bold,
    textAlign: "center",
  },
});

export default DriverTabNavigator;
