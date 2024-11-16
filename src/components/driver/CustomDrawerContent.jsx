// src/components/driver/CustomDrawerContent.jsx
import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import { useDriverAuth } from "@context/DriverAuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

const CustomDrawerContent = (props) => {
  const { driver, signOut } = useDriverAuth();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error("Error signing out:", error);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header/Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <MaterialCommunityIcons
            name="account"
            size={24}
            color={colors.text}
          />
          {driver?.isVerified && (
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={colors.success}
              />
            </View>
          )}
        </View>
        <Text style={styles.name}>
          {driver?.firstName} {driver?.lastName}
        </Text>
        <Text style={styles.phoneNumber}>{driver?.phoneNumber}</Text>

        {/* Driver Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {driver?.statistics?.totalTrips || 0}
            </Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {driver?.rating?.toFixed(1) || "5.0"}
            </Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Drawer Items */}
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerItems}
      >
        <DrawerItemList {...props} />
      </DrawerContentScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={colors.error}
          />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
    alignItems: "center",
  },
  profileImageContainer: {
    paddingTop: 20,
    borderRadius: 40,
    marginBottom: 12,
    position: "relative",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 2,
  },
  name: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray + "20",
    marginHorizontal: 20,
  },
  drawerItems: {
    paddingTop: 10,
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  signOutText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});

export default CustomDrawerContent;
