import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "@components/CustomButton";
import { colors, fonts } from "@constants/globalStyles";
import Entypo from "@expo/vector-icons/Entypo";

const BookButton = ({ onPress, disabled }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity>
          <View style={styles.scheduleBookContainer}>
            <Text style={styles.scheduleBookText}>Advance Booking</Text>
            <Entypo name="chevron-small-right" size={24} color={colors.textMid} />
          </View>
        </TouchableOpacity>
        <View style={styles.bookButton}>
          <CustomButton
            title="Book"
            onPress={onPress}
            disabled={disabled}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scheduleBookContainer: {
    alignItems: "center",
    paddingLeft: 10,
    flexDirection: "row",
  },
  bookButton: {
    alignItems: "center",
  },
  scheduleBookText: {
    fontFamily: fonts.regular,
    color: colors.textMid,
    fontSize: 14,
  },
  mainContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingTop: 20,
  },
  container: {
    // alignItems: "flex-start",
    textAlign: "left",
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: colors.background,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    elevation: 5,
    zIndex: 9,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -10,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    gap: 15,
  },
  button: {
    elevation: 4,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    marginBottom: 15,
    zIndex: 10,
  },
});

export default BookButton;
