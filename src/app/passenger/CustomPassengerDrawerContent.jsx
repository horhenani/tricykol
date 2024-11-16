import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { Text, Portal, Modal, Button } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import { useAuth } from "@context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CustomPassengerDrawerContent = (props) => {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  // const handleSignOut = () => {
  //   Alert.alert(
  //     "Sign Out",
  //     "Are you sure you want to sign out?",
  //     [
  //       {
  //         text: "Cancel",
  //         style: "cancel",
  //       },
  //       {
  //         text: "Sign Out",
  //         onPress: async () => {
  //           try {
  //             await signOut();
  //           } catch (error) {
  //             console.error("Error signing out:", error);
  //           }
  //         },
  //         style: "destructive",
  //       },
  //     ],
  //     { cancelable: true },
  //   );
  // };

  const [signOutModalVisible, setSignOutModalVisible] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setSignOutModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <MaterialCommunityIcons
            name="account"
            size={32}
            color={colors.text}
          />
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.phoneNumber}>{user?.phoneNumber}</Text>

        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {user?.statistics?.totalTrips || 0}
            </Text>
            <Text style={styles.statLabel}>Total Rides</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}></View>
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
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setSignOutModalVisible(true)}
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={colors.error}
          />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Portal>
        <Modal
          visible={signOutModalVisible}
          onDismiss={() => setSignOutModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Sign Out</Text>
          <Text style={styles.modalText}>
            Are you sure you want to sign out?
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => setSignOutModalVisible(false)}
              style={styles.modalButton}
              textColor={colors.text}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSignOut}
              style={[styles.modalButton, styles.ModalsignOutButton]}
              buttonColor={colors.error}
            >
              Sign Out
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
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
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalButton: {
    minWidth: 100,
  },
  ModalsignOutButton: {
    borderColor: colors.error,
  },


});

export default CustomPassengerDrawerContent;
