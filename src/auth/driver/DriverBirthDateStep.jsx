import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import AppHeader from "@components/AppHeader";

const DriverBirthDateStep = () => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(Platform.OS === "ios");
  const [isValid, setIsValid] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, phoneNumber, firstName, lastName } = route.params;

  useEffect(() => {
    // Validate minimum age (13 years)
    const today = new Date();
    const minAge = 13;
    const minDate = new Date(
      today.getFullYear() - minAge,
      today.getMonth(),
      today.getDate(),
    );
    setIsValid(date <= minDate);
  }, [date]);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === "ios");
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const handleNext = () => {
    if (isValid) {
      navigation.navigate("DriverSex", {
        userId,
        phoneNumber,
        firstName,
        lastName,
        birthdate: date.toISOString(),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <View style={styles.content}>
        <Text style={styles.title}>Select your birthdate</Text>
        <View>
          {Platform.OS === "android" && (
            <TouchableOpacity onPress={showDatepicker}>
              <Text style={styles.dateButton}>{date.toDateString()}</Text>
            </TouchableOpacity>
          )}
          {(show || Platform.OS === "ios") && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              is24Hour={true}
              display="spinner"
              onChange={onChange}
              style={styles.datePicker}
            />
          )}
        </View>
      </View>
      <View style={styles.buttonContainer}>
        {!isValid && (
          <Text style={styles.errorText}>
            You must be at least 13 years old to register.
          </Text>
        )}
        <CustomButton onPress={handleNext} disabled={!isValid} title="Next" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    marginBottom: 20,
    color: colors.text,
  },
  datePicker: {
    width: 320,
    height: 260,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  dateButton: {
    fontSize: 16,
    color: colors.secondary,
    marginBottom: 20,
    borderBottomWidth: 1,
    padding: 10,
    fontFamily: fonts.regular,
  },
  errorText: {
    color: colors.error,
    marginTop: 10,
    textAlign: "center",
    marginBottom: 10,
    fontFamily: fonts.regular,
  },
  buttonContainer: {
    gap: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default DriverBirthDateStep;
