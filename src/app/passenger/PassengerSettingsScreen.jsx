import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { colors, fonts } from "@constants/globalStyles";

const PassengerSettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {/* Add settings options here */}
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
    marginBottom: 20,
  },
});

export default PassengerSettingsScreen;
