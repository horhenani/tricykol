import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Modal, Portal, Text, Checkbox } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import useLocationService from "@services/useLocationService";
import { useState, useEffect } from "react";

// Welcome modal for new users in Dashboard
export const WelcomeLocationModal = ({
  visible,
  onDismiss,
  userName,
  onRequestPermission,
  onOpenSettings,
  isLocationEnabled,
  hasLocationPermission,
}) => {
  const insets = useSafeAreaInsets();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [locationChecked, setLocationChecked] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Reset states when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Start fresh each time modal shows
      setPermissionChecked(false);
      setLocationChecked(false);
      setSetupComplete(false);
    }
  }, [visible]);

  // Watch for changes in location permission and service status
  useEffect(() => {
    if (visible) {
      setPermissionChecked(hasLocationPermission);
      setLocationChecked(isLocationEnabled);

      // If both conditions are met, mark setup as complete
      if (hasLocationPermission && isLocationEnabled) {
        setSetupComplete(true);
      }
    }
  }, [hasLocationPermission, isLocationEnabled, visible]);

  const handleRequestPermission = async () => {
    const granted = await onRequestPermission();
    if (granted) {
      setPermissionChecked(true);
    }
  };

  const handleOpenSettings = () => {
    onOpenSettings();
  };

  const handleGetStarted = async () => {
    if (setupComplete && onDismiss) {
      await onDismiss();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={null} // Prevent dismissing by tapping outside
        contentContainerStyle={[
          styles.modalContainer,
          { paddingTop: insets.top },
        ]}
      >
        <View style={styles.welcomeContent}>
          <MaterialCommunityIcons
            name="map-marker-radius"
            size={64}
            color={colors.primary}
            style={styles.welcomeIcon}
          />

          <Text style={styles.welcomeTitle}>
            Welcome to Tricykol{userName ? `, ${userName}` : ""}! 🎉
          </Text>

          <Text style={styles.welcomeMessage}>
            To start using Tricykol, we need location access to find nearby
            riders. Please complete these steps:
          </Text>

          {!setupComplete ? (
            <View style={styles.setupSteps}>
              <View style={styles.stepContainer}>
                <Checkbox.Android
                  status={permissionChecked ? "checked" : "unchecked"}
                  disabled={true}
                  color={colors.success}
                />
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>Allow Location Access</Text>
                  <CustomButton
                    title="Allow Tricykol to use Location"
                    onPress={handleRequestPermission}
                    style={[
                      styles.stepButton,
                      permissionChecked && styles.completedButton,
                    ]}
                    disabled={permissionChecked}
                  />
                </View>
              </View>

              <View style={styles.stepContainer}>
                <Checkbox.Android
                  status={locationChecked ? "checked" : "unchecked"}
                  disabled={true}
                  color={colors.success}
                />
                <View style={styles.stepContent}>
                  <Text style={styles.stepText}>Enable Location Services</Text>
                  <CustomButton
                    title="Enable Location"
                    onPress={handleOpenSettings}
                    style={[
                      styles.stepButton,
                      locationChecked && styles.completedButton,
                    ]}
                    disabled={locationChecked}
                  />
                </View>
              </View>
            </View>
          ) : (
            <CustomButton
              title="Start Booking"
              onPress={handleGetStarted}
              style={styles.getStartedButton}
            />
          )}
        </View>
      </Modal>
    </Portal>
  );
};

// Bottom sheet alert for when location is disabled
export const LocationDisabledAlert = ({ visible, onDismiss }) => {
  const insets = useSafeAreaInsets();

  const { openLocationSettings } = useLocationService();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.bottomSheetContainer,
          { paddingBottom: insets.bottom },
        ]}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
            <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.alertContent}>
            <MaterialCommunityIcons
              name="map-marker-off"
              size={32}
              color={colors.error}
              style={styles.icon}
            />
            <Text style={styles.bottomSheetTitle}>Location is Disabled</Text>
            <Text style={styles.bottomSheetMessage}>
              Please enable location services in your device settings to
              continue using Tricykol and find nearby rides.
            </Text>
            <CustomButton
              title="Enable Location"
              onPress={openLocationSettings}
              style={styles.enableLocationButton}
            />
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    backgroundColor: colors.background,
    borderRadius: 15,
    padding: 20,
    elevation: 6,
  },
  welcomeContent: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  welcomeIcon: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
    textAlign: "center",
  },
  welcomeMessage: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  setupSteps: {
    width: "100%",
    gap: 20,
    marginTop: 10,
  },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 10,
    elevation: 2,
  },
  stepContent: {
    flex: 1,
    marginLeft: 10,
  },
  stepText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  stepButton: {
    width: "100%",
    height: 40,
  },
  completedButton: {
    backgroundColor: colors.success,
    opacity: 0.7,
  },
  getStartedButton: {
    width: "100%",
    marginTop: 20,
    backgroundColor: colors.primary,
  },

  enableLocationButton: {
    width: "100%",
    marginTop: 20,
    backgroundColor: colors.primary,
  },
  modalContainer: {
    margin: 20,
    backgroundColor: colors.background,
    borderRadius: 15,
    padding: 20,
    elevation: 6,
    zIndex: 1000,
  },
  bottomSheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 5,
    zindex: 100,
  },
  content: {
    alignItems: "center",
    paddingVertical: 10,
  },
  bottomSheetContent: {
    padding: 20,
  },
  handleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "transparent",
    borderRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  alertContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  bottomSheetMessage: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  button: {
    width: "100%",
    marginTop: 10,
  },
});
