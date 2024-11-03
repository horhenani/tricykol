import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { TextInput } from "react-native-paper";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";
import AppHeaderWithoutBack from "@components/AppHeaderWithoutBack";

const NameStep = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isValid, setIsValid] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, phoneNumber, userType } = route.params;

  useEffect(() => {
    // Validate both first and last names
    const validFirstName = firstName.trim().length >= 2;
    const validLastName = lastName.trim().length >= 2;
    setIsValid(validFirstName && validLastName);
  }, [firstName, lastName]);

  const validateName = (name) => {
    // Allow letters, spaces, and basic special characters used in names
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name);
  };

  const handleFirstNameChange = (text) => {
    if (text === "" || validateName(text)) {
      setFirstName(text);
    }
  };

  const handleLastNameChange = (text) => {
    if (text === "" || validateName(text)) {
      setLastName(text);
    }
  };

  const handleNext = () => {
    if (isValid) {
      navigation.navigate("Birthdate", {
        userId,
        phoneNumber,
        userType,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <AppHeaderWithoutBack />
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          // If you have a bottom tab navigator or fixed bottom elements, add their height
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.inputContainer}>
            <Text style={styles.title}>Enter your name</Text>
            <TextInput
              label="First Name"
              value={firstName}
              onChangeText={handleFirstNameChange}
              style={styles.input}
              mode="flat"
              autoFocus={true}
              contentStyle={styles.inputContent}
              underlineColor={colors.text}
              activeUnderlineColor={colors.secondary}
              error={firstName.length > 0 && firstName.length < 2}
            />
            {firstName.length > 0 && firstName.length < 2 && (
              <Text style={styles.errorText}>
                First name must be at least 2 characters
              </Text>
            )}

            <TextInput
              label="Last Name"
              value={lastName}
              onChangeText={handleLastNameChange}
              style={styles.input}
              mode="flat"
              contentStyle={styles.inputContent}
              underlineColor={colors.text}
              activeUnderlineColor={colors.secondary}
              error={lastName.length > 0 && lastName.length < 2}
            />
            {lastName.length > 0 && lastName.length < 2 && (
              <Text style={styles.errorText}>
                Last name must be at least 2 characters
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              onPress={handleNext}
              disabled={!isValid}
              title="Next"
            />
          </View>
        </KeyboardAvoidingView>
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
    padding: 20,
    justifyContent: "space-between",
  },
  inputContainer: {
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    marginBottom: 20,
    color: colors.text,
  },
  input: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  inputContent: {
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: -16,
    marginBottom: 16,
    marginLeft: 4,
  },
  buttonContainer: {
    alignItems: "center",
  },
});

export default NameStep;
