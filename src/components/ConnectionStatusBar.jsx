// src/components/ConnectionStatusBar.jsx
import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text } from "react-native-paper";
import { colors, fonts } from "@constants/globalStyles";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

const ConnectionStatusBar = () => {
  const { isConnected, isConnectionStable } = useNetworkStatus();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: !isConnectionStable ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnectionStable]);

  if (isConnectionStable) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>
        {!isConnected ? "No Internet Connection" : "Poor Connection"}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.error,
    paddingVertical: 5,
    alignItems: "center",
    zIndex: 9999,
  },
  text: {
    color: colors.background,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});

export default ConnectionStatusBar;
