// src/components/CustomButton.js
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors, fonts } from "@constants/globalStyles";

const CustomButton = ({
  title,
  onPress,
  style,
  buttonTextStyle,
  disabled,
  loading = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        style,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            buttonTextStyle,
            (disabled || loading) && styles.disabledButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: 300,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonText: {
    opacity: 0.5,
  },
});

export default CustomButton;
