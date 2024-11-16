import React from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Text } from "react-native-paper";
import { colors, fonts } from "@constants/globalStyles";

const PassengerHistoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip History</Text>
      {/* Add trip history list here */}
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

export default PassengerHistoryScreen;
