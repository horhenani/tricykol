import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Modal, Portal, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import useLocationService from "@services/useLocationService";


// Welcome modal for new users in Dashboard
export const WelcomeLocationModal = ({ visible, onDismiss, userName }) => {
  const insets = useSafeAreaInsets();


  const handleGetStarted = async () => {
    if (onDismiss) {
      await onDismiss();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
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
            We're excited to help you find the best rides in your area. To get
            started and connect you with nearby riders, we'll need access to
            your location.
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="map-marker-check"
                size={24}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>
                Find nearby riders instantly
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons
                name="shield-check"
                size={24}
                color={colors.secondary}
              />
              <Text style={styles.featureText}>Safe and reliable journeys</Text>
            </View>
          </View>

          <CustomButton
            title="Get Started"
            onPress={handleGetStarted}
            style={styles.welcomeButton}
          />
        </View>
      </Modal>
    </Portal>
  );
};

// Bottom sheet alert for when location is disabled
export const LocationDisabledAlert = ({
  visible,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();

  const {
    openLocationSettings,
  } = useLocationService();


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
  featuresList: {
    width: "100%",
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  featureText: {
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  welcomeButton: {
    width: "100%",
    marginTop: 10,
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
    zindex: 999,
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
    backgroundColor: 'transparent',
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
