import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
} from "react-native";
import { colors, fonts } from "@constants/globalStyles";
import { useDriverAuth } from "@context/DriverAuthContext";
import firestore from "@react-native-firebase/firestore";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const CompletedBookingCard = ({ booking }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.toDate());
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header with date and fare */}
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(booking.completedAt)}</Text>
        <Text style={styles.fareText}>₱{booking.route.fare}</Text>
      </View>

      {/* Locations */}
      <View style={styles.locationsContainer}>
        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="map-marker"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {booking.pickup.address}
          </Text>
        </View>

        <View style={styles.locationDivider} />

        <View style={styles.locationItem}>
          <MaterialCommunityIcons
            name="map-marker-check"
            size={20}
            color={colors.secondary}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {booking.dropoff.address}
          </Text>
        </View>
      </View>

      {/* Trip Info */}
      <View style={styles.tripInfo}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name="map-marker-distance"
            size={16}
            color={colors.text}
          />
          <Text style={styles.infoText}>
            {booking.route.distance.toFixed(1)} km
          </Text>
        </View>

        <View style={styles.infoItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={16}
            color={colors.text}
          />
          <Text style={styles.infoText}>
            {Math.ceil(booking.route.duration)} mins
          </Text>
        </View>
      </View>
    </View>
  );
};

const BookingHistoryScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { driver } = useDriverAuth();

  const fetchCompletedBookings = async () => {
    try {
      if (!driver?.uid) return;

      const bookingsSnapshot = await firestore()
        .collection("bookings")
        .where("driverId", "==", driver.uid)
        .where("status", "==", "completed")
        .orderBy("completedAt", "desc")
        .limit(20)
        .get();

      const completedBookings = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBookings(completedBookings);
    } catch (error) {
      console.error("Error fetching completed bookings:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompletedBookings();
  }, [driver?.uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompletedBookings();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading booking history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bookings}
        renderItem={({ item }) => <CompletedBookingCard booking={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed bookings yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.text,
  },
  // Card Styles
  cardContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray + "20",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.gray,
  },
  fareText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.primary,
  },
  locationsContainer: {
    marginBottom: 12,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  locationText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  locationDivider: {
    height: 20,
    width: 1,
    backgroundColor: colors.gray + "40",
    marginLeft: 10,
  },
  tripInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
    paddingTop: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    marginLeft: 4,
  },
});

export default BookingHistoryScreen;
