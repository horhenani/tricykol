// src/components/CustomButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import {
  globalStyles,
  colors,
  fontSizes,
  fonts,
  spacing,
} from "../styles/globalStyles";
import { Icon } from "react-native-paper";

const IconButton = ({
  source,
  color,
  size,
  onPress,
  style,
  buttonTextStyle,
  disabled,
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, style, disabled && styles.disabledButton]}
      onPress={onPress}
      activeOpacity={0.9}
      disabled={disabled}
    >
      <Icon
        style={[
          styles.buttonText,
          buttonTextStyle,
          disabled && styles.disabledButtonText,
        ]}
        source={source}
        size={size}
        color={color}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 100,
    alignItems: "center",
    width: 60,
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

export default IconButton;
