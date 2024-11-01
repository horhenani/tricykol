import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OtpInput } from "react-native-otp-entry";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { useAuth } from "@context/AuthContext";
import { colors, fonts } from "@constants/globalStyles";
import AppHeader from "@components/AppHeader";
import CustomButton from "@components/CustomButton";
import ResendLink from "@components/ResendLink";

const OtpScreen = ({ navigation, route }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const { verificationId, phoneNumber, userType } = route.params;
  const { checkUserExists } = useAuth();

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      // Create credential
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);

      // Sign in with credential
      const userCredential = await auth().signInWithCredential(credential);
      const user = userCredential.user;

      // Check if user exists in Firestore
      const exists = await checkUserExists(user.uid);

      if (exists) {
        // Let AuthContext handle the navigation through auth state change
      } else {
        // New user - start registration flow
        navigation.replace("Name", {
          userId: user.uid,
          phoneNumber: user.phoneNumber,
          userType,
        });
      }
    } catch (error) {
      let errorMessage = "Failed to verify code. Please try again.";

      if (error.code === "auth/invalid-verification-code") {
        errorMessage = "The code you entered is invalid.";
      } else if (error.code === "auth/code-expired") {
        errorMessage =
          "The verification code has expired. Please request a new one.";
      }

      Alert.alert("Verification Failed", errorMessage);
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await auth().verifyPhoneNumber(phoneNumber);
      Alert.alert("Success", "A new verification code has been sent.");
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to resend verification code. Please try again later.",
      );
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <AppHeader />
        <View style={styles.content}>
          <View style={styles.otpContainer}>
            <View>
              <Text style={styles.label}>
                Enter the verification code sent to
              </Text>
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>
            </View>

            <OtpInput
              numberOfDigits={6}
              onTextChange={setOtp}
              focusColor={colors.primary}
              inputValue={otp}
              theme={{
                pinCodeContainerStyle: styles.otpBox,
                pinCodeTextStyle: styles.otpText,
              }}
            />

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <ResendLink onResend={handleResend} />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              title="Verify"
              onPress={handleVerifyOtp}
              disabled={otp.length !== 6 || loading}
              loading={loading}
            />
          </View>
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
    justifyContent: "space-between",
    padding: 20,
  },
  otpContainer: {
    padding: 20,
    gap: 40,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text,
    lineHeight: 25,
  },
  phoneNumber: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    marginTop: 5,
  },
  otpBox: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colors.gray,
  },
  otpText: {
    fontFamily: fonts.regular,
    fontSize: 18,
    color: colors.text,
  },
  resendContainer: {
    alignItems: "center",
  },
  resendText: {
    textAlign: "center",
    fontFamily: fonts.regular,
    color: colors.text,
  },
  buttonContainer: {
    alignItems: "center",
  },
});

export default OtpScreen;
