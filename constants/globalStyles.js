// src/styles/globalStyles.js
import { StyleSheet } from "react-native";
import { DefaultTheme } from "react-native-paper";

export const colors = {
  primary: "#F6C745",
  secondary: "#0c1d3b",
  background: "#FFFFFF",
  text: "#0c1d3b",
  textLight: "#FFFFFF",
  error: "#fc967e",
  success: "#34C759",
  warning: "#FFCC00",
  gray: "#8E8E93",
  disabled: "rgb(211, 211, 211)",
  blue: "#6bbfff",
  textMid: "#606d80",
};

export const fonts = {
  regular: "Outfit-Regular",
  medium: "Outfit-Medium",
  semiBold: "Outfit-SemiBold",
  bold: "Outfit-Bold",
  black: "Outfit-Black",
  thin: "Outfit-Thin",
  extraBold: "Outfit-ExtraBold",
  extraLight: "Outfit-ExtraLight",
  thin: "Outfit-Thin",
  weight: "Outfit-VariableFont_wght",
};

export const fontSizes = {
  small: 12,
  medium: 16,
  large: 20,
  extraLarge: 24,
  huge: 32,
};

export const spacing = {
  small: 8,
  medium: 16,
  large: 24,
  extraLarge: 32,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  text: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.medium,
    color: colors.text,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.extraLarge,
    color: colors.text,
    marginBottom: spacing.large,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.medium,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.medium,
    color: colors.textLight,
  },
});

export const customTheme = {
  ...DefaultTheme,
  colors: {
    primary: colors.primary,
    accent: colors.secondary, // Using secondary as accent
    background: colors.background,
    surface: colors.background,
    text: colors.text,
    error: colors.error,
    onSurface: colors.text,
    disabled: colors.gray,
    placeholder: colors.gray,
    backdrop: colors.secondary + "80", // Adding 50% opacity
    notification: colors.warning,
  },
};

export default {
  colors,
  fonts,
  fontSizes,
  spacing,
  globalStyles,
  customTheme,
};
