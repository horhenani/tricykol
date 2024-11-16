import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Switch } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/globalStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AntDesign from "@expo/vector-icons/AntDesign";
import { useDriverAuth } from "@context/DriverAuthContext";
import { useNavigation, DrawerActions } from "@react-navigation/native";

const DriverHeader = ({ status, onStatusChange }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const handleToggle = () => {
    const newStatus = status === "offline" ? "online" : "offline";
    onStatusChange(newStatus);
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <MaterialCommunityIcons
            name="menu"
            size={24}
            color={colors.text}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons
            name={status === "online" ? "circle" : "circle-outline"}
            size={12}
            color={status === "online" ? colors.success : colors.gray}
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {status === "online" ? "Online" : "Offline"}
          </Text>
          <Switch
            value={status === "online"}
            onValueChange={handleToggle}
            color={colors.success}
          />
        </View>
        <TouchableOpacity style={styles.chatButton}>
          <AntDesign name="customerservice" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    // borderBottomWidth: 1,
    // borderBottomColor: colors.gray + "20",
    // elevation: 4,
    // shadowColor: colors.text,
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    elevation: 8,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 100,
    padding: 6,
    elevation: 8,
  },

  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 100,
    padding: 6,
    elevation: 8,
  },

  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
});

export default DriverHeader;
