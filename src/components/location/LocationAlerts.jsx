import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Modal, Portal, Text, Checkbox } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import useLocationService from "@services/useLocationService";
import { useState, useEffect } from "react";
import Fontisto from "@expo/vector-icons/Fontisto";

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

  const { checkLocationPermission } = useLocationService();

  // Reset states when modal becomes visible
  useEffect(() => {
    // Reset steps if either condition becomes false
    if (!isLocationEnabled || !hasLocationPermission) {
      setPermissionChecked(hasLocationPermission);
      setLocationChecked(isLocationEnabled);
      setSetupComplete(false);
    }
  }, [isLocationEnabled, hasLocationPermission]);

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
    try {
      // Call the provided onRequestPermission callback and await its result
      const granted = await onRequestPermission();

      // Only update UI if permission was actually granted
      if (granted) {
        setPermissionChecked(true);
        // Force a recheck of location permission state
        await checkLocationPermission?.();
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
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

  const renderSetupButton = (title, onPress, isChecked) => (
    <TouchableOpacity
      style={[styles.setupButton, isChecked && styles.completedButton]}
      onPress={onPress}
      disabled={isChecked}
      activeOpacity={0.7}
    >
      <Checkbox.Android
        status={isChecked ? "checked" : "unchecked"}
        color={colors.text}
      />
      <Text
        style={[
          styles.setupButtonText,
          isChecked && styles.completedButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={null}
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
              {renderSetupButton(
                "Allow Location access",
                handleRequestPermission,
                permissionChecked,
              )}
              {renderSetupButton(
                "Enable Location",
                handleOpenSettings,
                locationChecked,
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.7}
            >
              <Text style={styles.getStartedButtonText}>Start Booking</Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </Portal>
  );
};

// Bottom sheet alert for when location is disabled
export const LocationDisabledAlert = ({ visible, onDismiss }) => {
  const insets = useSafeAreaInsets();

  const { openLocationSettings, isLocationEnabled } = useLocationService();

  useEffect(() => {
    if (isLocationEnabled && visible) {
      onDismiss();
    }
  }, [isLocationEnabled, visible]);

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

export const DriverWelcomeLocationModal = ({
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

  const { checkLocationPermission } = useLocationService();

  // Reset states when modal becomes visible
  useEffect(() => {
    if (!isLocationEnabled || !hasLocationPermission) {
      setPermissionChecked(hasLocationPermission);
      setLocationChecked(isLocationEnabled);
      setSetupComplete(false);
    }
  }, [isLocationEnabled, hasLocationPermission]);

  // Watch for changes in location permission and service status
  useEffect(() => {
    if (visible) {
      setPermissionChecked(hasLocationPermission);
      setLocationChecked(isLocationEnabled);

      if (hasLocationPermission && isLocationEnabled) {
        setSetupComplete(true);
      }
    }
  }, [hasLocationPermission, isLocationEnabled, visible]);

  const handleRequestPermission = async () => {
    try {
      const granted = await onRequestPermission();
      if (granted) {
        setPermissionChecked(true);
        await checkLocationPermission?.();
      }
    } catch (error) {
      console.error("Error requesting location permission:", error);
    }
  };

  const handleGetStarted = async () => {
    if (setupComplete && onDismiss) {
      await onDismiss();
    }
  };

  const renderSetupButton = (title, onPress, isChecked) => (
    <TouchableOpacity
      style={[styles.setupButton, isChecked && styles.completedButton]}
      onPress={onPress}
      disabled={isChecked}
      activeOpacity={0.7}
    >
      <Checkbox.Android
        status={isChecked ? "checked" : "unchecked"}
        color={colors.text}
      />
      <Text
        style={[
          styles.setupButtonText,
          isChecked && styles.completedButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={null}
        contentContainerStyle={[
          styles.modalContainer,
          { paddingTop: insets.top },
        ]}
      >
        <View style={styles.welcomeContent}>
          <Fontisto name="motorcycle" size={60} color={colors.primary} />

          <Text style={styles.welcomeTitle}>
            Welcome Angkol{userName ? `, ${userName}` : ""}! 🎉
          </Text>

          <Text style={styles.welcomeMessage}>
            To start accepting bookings, we need location access to connect you
            with nearby passengers. Please complete these steps:
          </Text>

          {!setupComplete ? (
            <View style={styles.setupSteps}>
              {renderSetupButton(
                "Allow Location access",
                handleRequestPermission,
                permissionChecked,
              )}
              {renderSetupButton(
                "Enable Location",
                onOpenSettings,
                locationChecked,
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.7}
            >
              <Text style={styles.getStartedButtonText}>
                Start Accepting Bookings
              </Text>
            </TouchableOpacity>
          )}

          {/* Additional driver-specific info */}
          <View style={styles.driverInfo}>
            <Text style={styles.driverInfoText}>
              Remember: Keep your location enabled while online to receive
              nearby booking requests.
            </Text>
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
    gap: 16,
  },
  setupButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  setupButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
  },
  completedButton: {},
  completedButtonText: {
    color: colors.text,
  },
  getStartedButton: {
    width: "100%",
    height: 50,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 20,
    elevation: 2,
  },
  getStartedButtonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.medium,
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

  driverInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.primary + "10",
    borderRadius: 8,
  },
  driverInfoText: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
    textAlign: "center",
  },
});
