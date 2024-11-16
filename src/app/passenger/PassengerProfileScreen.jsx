// src/app/passenger/screens/PassengerProfileScreen.jsx
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, fonts } from '@constants/globalStyles';
import { useAuth } from '@context/AuthContext';

const PassengerProfileScreen = () => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      {/* Add profile content here */}
    </ScrollView>
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

export default PassengerProfileScreen;

