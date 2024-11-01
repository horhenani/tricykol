import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@context/AuthContext";
import { fonts, colors } from "@constants/globalStyles";
import AppHeader from "@components/AppHeader";
import CustomButton from "@components/CustomButton";

const RegisterScreen = ({ navigation, route }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userType } = route.params;
  const { signInWithPhone } = useAuth();

  // Validate Philippine mobile number (must start with 9 and be 10 digits)
  const validatePhoneNumber = (number) => {
    const phoneRegex = /^9\d{9}$/;
    return phoneRegex.test(number);
  };

  const handlePhoneChange = (text) => {
    // Remove any non-numeric characters
    const numericText = text.replace(/[^0-9]/g, "");
    setPhoneNumber(numericText);
    setIsValid(validatePhoneNumber(numericText));
  };

  const handleSendOTP = async () => {
    if (!isValid) return;

    setLoading(true);
    Keyboard.dismiss();

    try {
      const confirmation = await signInWithPhone(phoneNumber);
      navigation.navigate("OtpVerification", {
        verificationId: confirmation.verificationId,
        phoneNumber: `+63${phoneNumber}`,
        userType,
      });
    } catch (error) {
      let errorMessage = "Failed to send verification code. Please try again.";

      if (error.code === "auth/invalid-phone-number") {
        errorMessage = "The phone number format is incorrect.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <KeyboardAvoidingView style={styles.mainContent}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter your mobile number:</Text>
            <Text style={styles.description}>
              We'll send you a verification code to verify your number.
            </Text>

            <Text style={styles.phoneLabel}>
              Phone number: <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              autoFocus={true}
              maxLength={10}
              placeholder="9213456789"
              placeholderTextColor={colors.gray}
              mode="outlined"
              error={phoneNumber.length > 0 && !isValid}
              disabled={loading}
              activeOutlineColor={colors.secondary}
              left={
                <TextInput.Icon
                  icon={() => (
                    <View style={styles.affixContainer}>
                      <Text style={styles.countryCode}>+63</Text>
                      <Text style={styles.separator}> | </Text>
                    </View>
                  )}
                  style={styles.textIcon}
                />
              }
            />
            {phoneNumber.length > 0 && !isValid && (
              <Text style={styles.errorText}>
                Please enter a valid 10-digit number starting with 9
              </Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Verify"
              onPress={handleSendOTP}
              disabled={!isValid || loading}
              loading={loading}
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
  mainContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  inputContainer: {
    padding: 25,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 20,
  },
  phoneLabel: {
    fontFamily: fonts.regular,
    color: colors.text,
    marginBottom: 10,
  },
  required: {
    color: colors.error,
    fontFamily: fonts.regular,
  },
  input: {
    marginBottom: 8,
    borderRadius: 5,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  textIcon: {
    borderRadius: 0,
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    top: 2,
  },
  affixContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    fontFamily: fonts.regular,
  },
  countryCode: {
    color: colors.text,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  separator: {
    color: colors.gray,
  },
  errorText: {
    color: colors.error,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
});

export default RegisterScreen;
