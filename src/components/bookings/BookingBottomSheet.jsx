import React, { useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { colors, fonts } from "@constants/globalStyles";

const BookingBottomSheet = ({ visible, onDismiss }) => {
  // ref
  const bottomSheetModalRef = useRef(null);

  // variables
  // const snapPoints = useMemo(() => ["75%", "85%"], []);
  const snapPoints = useMemo(() => ["100%", "75%"], []);

  // callbacks
  const handleSheetChanges = useCallback(
    (index) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
  );

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

  // effects
  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={true}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>Where to?</Text>

        {/* Current Location Input */}
        <TextInput
          mode="outlined"
          placeholder="Current Location"
          left={
            <TextInput.Icon
              icon={() => (
                <MaterialCommunityIcons
                  name="map-marker"
                  size={24}
                  color={colors.primary}
                />
              )}
            />
          }
          right={
            <TextInput.Icon
              icon="crosshairs-gps"
              color={colors.primary}
              onPress={() => {
                // Handle getting current location
              }}
            />
          }
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.secondary}
          disabled
        />

        {/* Destination Input */}
        <TextInput
          mode="outlined"
          placeholder="Enter Destination"
          left={
            <TextInput.Icon
              icon={() => (
                <MaterialCommunityIcons
                  name="map-marker-check"
                  size={24}
                  color={colors.secondary}
                />
              )}
            />
          }
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.secondary}
          onPressIn={() => {
            // Navigate to search screen
          }}
        />

        {/* Saved Places Section */}
        <View style={styles.savedPlaces}>
          <Text style={styles.sectionTitle}>Saved Places</Text>

          {/* Home Location Button */}
          <TouchableOpacity style={styles.savedPlaceButton}>
            <MaterialCommunityIcons name="home" size={24} color={colors.text} />
            <View style={styles.savedPlaceText}>
              <Text style={styles.placeTitle}>Home</Text>
              <Text style={styles.placeAddress} numberOfLines={1}>
                Add home location
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.gray}
            />
          </TouchableOpacity>

          {/* Work Location Button */}
          <TouchableOpacity style={styles.savedPlaceButton}>
            <MaterialCommunityIcons
              name="briefcase"
              size={24}
              color={colors.text}
            />
            <View style={styles.savedPlaceText}>
              <Text style={styles.placeTitle}>Work</Text>
              <Text style={styles.placeAddress} numberOfLines={1}>
                Add work location
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.gray}
            />
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  handleIndicator: {
    // backgroundColor: colors.gray,
    backgroundColor: 'transparent',
    width: 40,
    // height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    marginBottom: 20,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  savedPlaces: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 12,
  },
  savedPlaceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  savedPlaceText: {
    flex: 1,
    marginLeft: 12,
  },
  placeTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  placeAddress: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
});

export default BookingBottomSheet;
