import React from "react";
import { View, Text, StyleSheet, SafeAreaView, Image } from "react-native";
import { Appbar } from "react-native-paper";
import { Avatar } from "react-native-paper";
import { colors, fonts, fontSizes } from "@constants/globalStyles";
import CustomButton from "@components/CustomButton";

const WelcomeScreen = ({ navigation }) => {
  const handleUserTypeSelect = (userType) => {
    navigation.navigate("Register", { userType });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header} statusBarHeight={50}>
        <Avatar.Image
          style={styles.headerLogo}
          size={24}
          source={require("@assets/images/logo.png")}
        />
        <Appbar.Content title="Tricykol" titleStyle={styles.headerContent} />
      </Appbar.Header>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Image
            source={require("@assets/images/logov3.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to Tricykol</Text>
          <Text style={styles.subtitle}>Ang Traysikel ni Angkol!</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Text style={styles.prompt}>Bossing! Anong trip natin?</Text>

          <CustomButton
            title="Book a Tricykol"
            onPress={() => handleUserTypeSelect("passenger")}
            style={styles.passengerButton}
          />
          <CustomButton
            title="Be an Angkol Rider"
            onPress={() => handleUserTypeSelect("driver")}
            style={styles.riderButton}
            buttonTextStyle={{ color: colors.text }}
          />
          <Text style={styles.termsText}>Terms and Conditions Apply</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: "transparent",
    paddingLeft: 25,
  },
  headerLogo: {
    marginHorizontal: 10,
    backfaceVisibility: "hidden",
    backgroundColor: colors.text,
    width: 28,
    height: 28,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    color: colors.text,
    fontSize: fontSizes.medium,
    fontFamily: fonts.regular,
  },
  content: {
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
    padding: 20,
    width: "100%",
  },
  titleContainer: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 180,
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.bold,
    fontSize: fontSizes.large,
    marginBottom: 10,
  },
  subtitle: {
    color: colors.text,
    fontSize: fontSizes.medium,
    marginBottom: 5,
    fontFamily: fonts.regular,
  },
  buttonContainer: {
    alignItems: "center",
    width: "100%",
    gap: 20,
  },
  prompt: {
    color: colors.text,
    fontSize: fontSizes.medium,
    marginBottom: 30,
    fontFamily: fonts.regular,
  },
  riderButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  termsText: {
    fontFamily: fonts.regular,
    color: colors.text,
  },
});

export default WelcomeScreen;
