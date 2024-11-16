// src/config/flashMessageConfig.js
import { Platform } from "react-native";
import { fonts } from "@constants/globalStyles";

export const flashMessageConfig = {
  position: "top",
  floating: true, // Makes the message float above content
  style: {
    marginTop: Platform.OS === "android" ? 40 : 0, // Fixed value if you don't want to use dynamic insets
  },
  titleStyle: {
    fontFamily: fonts.medium,
  },
  textStyle: {
    fontFamily: fonts.regular,
  },
  duration: 3000,
  animated: true,
  animationDuration: 225,
  backgroundColor: undefined, // Let it use default color based on type
  icon: undefined, // Let it use default icon based on type
};
