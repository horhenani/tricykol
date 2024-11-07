import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, BackHandler } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BookingConfirmationSheet = ({
  bottomSheetRef,
  isVisible,
  onClose,
  onConfirm,
  pickup,
  dropoff,
  routeInfo,
  isLoading,
}) => {
  const insets = useSafeAreaInsets();

  // Variables for bottom sheet
  const snapPoints = useMemo(() => ["50%", "75%"], []);
  // const [selectedPayment, setSelectedPayment] = useState(PaymentMethod.CASH);

  // Callbacks for bottom sheet
  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onClose();
      }
    },
    [onClose],
  );

  // Backdrop component
  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
      enablePanDownToClose={true}
    >
      <BottomSheetView style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Booking</Text>
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={colors.text}
            onPress={onClose}
            style={styles.closeIcon}
          />
        </View>

        {/* Route Details */}
        <View style={styles.routeDetails}>
          <View style={styles.locationItem}>
            <MaterialCommunityIcons
              name="map-marker"
              size={24}
              color={colors.primary}
            />
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationName}>{pickup?.title}</Text>
              <Text style={styles.locationDescription} numberOfLines={1}>
                {pickup?.description}
              </Text>
            </View>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.verticalLine} />
          </View>

          <View style={styles.locationItem}>
            <MaterialCommunityIcons
              name="map-marker-check"
              size={24}
              color={colors.secondary}
            />
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>Drop-off</Text>
              <Text style={styles.locationName}>{dropoff?.title}</Text>
              <Text style={styles.locationDescription} numberOfLines={1}>
                {dropoff?.description}
              </Text>
            </View>
          </View>
        </View>

        {/* Trip Information */}
        {routeInfo && (
          <View style={styles.tripInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.infoText}>
                  {routeInfo.distance.toFixed(1)} km
                </Text>
              </View>

              <View style={styles.infoItem}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={colors.text}
                />
                <Text style={styles.infoText}>
                  {Math.ceil(routeInfo.duration)} mins
                </Text>
              </View>
            </View>

            <View style={styles.fareContainer}>
              <Text style={styles.fareLabel}>Total Fare</Text>
              <View style={styles.fareAmount}>
                <MaterialCommunityIcons
                  name="cash"
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.fareText}>₱{routeInfo.fare}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <CustomButton
            title="Cancel"
            onPress={onClose}
            style={[styles.button, styles.cancelButton]}
            buttonTextStyle={styles.cancelButtonText}
          />
          <CustomButton
            title="Confirm Booking"
            onPress={onConfirm}
            style={[styles.button, styles.confirmButton]}
            loading={isLoading}
            disabled={isLoading}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  handleIndicator: {
    backgroundColor: colors.gray,
    width: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  closeIcon: {
    padding: 4,
  },
  routeDetails: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  locationText: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.gray,
    marginBottom: 2,
  },
  locationName: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  locationDescription: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  dividerContainer: {
    alignItems: "center",
    paddingLeft: 11,
    paddingVertical: 4,
  },
  verticalLine: {
    width: 1,
    height: 20,
    backgroundColor: colors.gray + "40",
  },
  tripInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  fareContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    paddingTop: 16,
  },
  fareLabel: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.gray,
    marginBottom: 8,
  },
  fareAmount: {
    flexDirection: "row",
    alignItems: "center",
  },
  fareText: {
    marginLeft: 8,
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: colors.primary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: "auto",
    paddingTop: 20,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.gray,
  },
  cancelButtonText: {
    color: colors.text,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
});

export default BookingConfirmationSheet;
