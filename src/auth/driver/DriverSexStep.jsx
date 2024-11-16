import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { RadioButton } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "@constants/globalStyles";
import { useDriverAuth } from "@context/DriverAuthContext";
import CustomButton from "@components/CustomButton";
import AppHeader from "@components/AppHeader";
import firestore from "@react-native-firebase/firestore";

const DriverSexStep = () => {
  const [sex, setSex] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { createDriverProfile } = useDriverAuth();

  const { userId, phoneNumber, firstName, lastName, birthdate } = route.params;

  const handleSubmit = async () => {
    if (!sex) return;

    setLoading(true);
    try {
      // Prepare user data
      const userData = {
        firstName,
        lastName,
        birthDate: birthdate,
        sex,
        phoneNumber,
        isOnline: false,
        type: "driver",
      };

      // Create user profile in Firestore
      await createDriverProfile(userId, userData);
    } catch (error) {
      console.error("Profile creation error:", error);
      Alert.alert(
        "Registration Failed",
        "Failed to create your profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.content}>
          <Text style={styles.title}>Select your sex</Text>

          <RadioButton.Group
            onValueChange={(value) => setSex(value)}
            value={sex}
          >
            <View style={styles.radioContainer}>
              <RadioButton.Item
                label="Male"
                value="male"
                position="leading"
                labelStyle={styles.radioLabel}
                style={styles.radioButton}
                color={colors.secondary}
                uncheckedColor={colors.gray}
              />

              <RadioButton.Item
                label="Female"
                value="female"
                position="leading"
                labelStyle={styles.radioLabel}
                style={styles.radioButton}
                color={colors.secondary}
                uncheckedColor={colors.gray}
              />

              <RadioButton.Item
                label="Prefer not to say"
                value="undisclosed"
                position="leading"
                labelStyle={styles.radioLabel}
                style={styles.radioButton}
                color={colors.secondary}
                uncheckedColor={colors.gray}
              />
            </View>
          </RadioButton.Group>
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            title="Complete Registration"
            onPress={handleSubmit}
            disabled={!sex || loading}
            loading={loading}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    marginBottom: 20,
    color: colors.text,
  },
  radioContainer: {
    marginTop: 10,
  },
  radioButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: 8,
    marginVertical: 4,
  },
  radioLabel: {
    textAlign: "left",
    marginLeft: 8,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: "center",
  },
});

export default DriverSexStep;
