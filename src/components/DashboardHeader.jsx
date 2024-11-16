import React, { useState } from "react";
import { View, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { Appbar, Portal, Modal, Button, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@context/AuthContext";
import { colors, fonts } from "@constants/globalStyles";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";

const DashboardHeader = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
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
    <>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.Action
            rippleColor={"transparent"}
            style={styles.menuButton}
            icon="menu"
            color={colors.text}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          />
          <Appbar.Content title="" />
          <TouchableOpacity
            style={{
              backgroundColor: colors.background,
              padding: 10,
              borderRadius: 100,
              borderWidth: 1,
              borderColor: colors.gray,
            }}
          >
            <AntDesign name="customerservice" size={24} color="black" />
          </TouchableOpacity>
        </Appbar.Header>
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
              style={[styles.modalButton, styles.signOutButton]}
              buttonColor={colors.error}
            >
              Sign Out
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    backgroundColor: colors.background,
    padding: 10,
    paddingBottom: 13,
    borderRadius: 100,
    elevation: 99,
    borderColor: colors.gray,
    borderWidth: 1,
  },
  header: {
    position: "absolute",
    top: -22,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  appbar: {
    flex: 1,
    backgroundColor: "transparent",
    elevation: 0,
    paddingHorizontal: 15,
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
  signOutButton: {
    borderColor: colors.error,
  },
});

export default DashboardHeader;
