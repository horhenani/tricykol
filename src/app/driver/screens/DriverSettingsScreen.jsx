// src/app/driver/screens/DriverProfileScreen.jsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { colors, fonts } from "@constants/globalStyles";

const DriverProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
});

export default DriverProfileScreen;
