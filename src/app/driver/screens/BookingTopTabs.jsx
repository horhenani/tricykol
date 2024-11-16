// src/navigation/BookingTopTabs.jsx
import React from "react";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { colors, fonts } from "@constants/globalStyles";
import AvailableBookingsScreen from "@app/driver/screens/AvailableBookingScreen";
import BookingHistoryScreen from "@app/driver/screens/BookingHistoryScreen";

const Tab = createMaterialTopTabNavigator();

const BookingTopTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray + "20",
        },
        tabBarIndicatorStyle: {
          backgroundColor: colors.primary,
          height: 3,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          textTransform: "none",
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
      }}
    >
      <Tab.Screen
        name="Available"
        component={AvailableBookingsScreen}
        options={{
          title: "Available",
        }}
      />
      <Tab.Screen
        name="History"
        component={BookingHistoryScreen}
        options={{
          title: "History",
        }}
      />
    </Tab.Navigator>
  );
};

export default BookingTopTabs;
