import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "@components/CustomButton";
import { colors } from "@constants/globalStyles";

const BookButton = ({ onPress, disabled }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.mainContainer}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
        <CustomButton
          title="Book Now"
          onPress={onPress}
          disabled={disabled}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingTop: 20,
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
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
