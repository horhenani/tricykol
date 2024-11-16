// src/app/bookings/BookingScreen.jsx
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  BackHandler,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text, TextInput, Divider, Portal } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import firestore from "@react-native-firebase/firestore";
import { colors, fonts } from "@constants/globalStyles";
import useLocationService from "@services/useLocationService";
import AppHeader from "@components/AppHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "@components/CustomButton";
import { useNavigation, useRoute } from "@react-navigation/native";
import BookingConfirmationSheet from "@components/bookings/BookingConfirmationSheet";
import { showMessage } from "react-native-flash-message";
import { BookingService } from "@services/bookingService";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheetModalProvider from "@gorhom/bottom-sheet";
import { decodeDirectionsToCoordinates } from "@utils/mapUtils"; // Make sure this is imported
import { GOOGLE_MAPS_API_KEY } from "@config/keys";

// Search scoring utility
const calculateSearchScore = (place, searchTerms, userLocation) => {
  let score = 0;
  const searchText = searchTerms.join(" ").toLowerCase();
  const nameWords = place.name.toLowerCase().split(" ");
  const addressWords = place.address.toLowerCase().split(" ");

  // Exact match bonuses
  if (place.name.toLowerCase() === searchText) score += 100;
  if (place.address.toLowerCase().includes(searchText)) score += 50;

  // Term matching scoring
  searchTerms.forEach((term) => {
    // Name matches
    if (place.name.toLowerCase().startsWith(term)) score += 30;
    if (place.name.toLowerCase().includes(term)) score += 20;

    // Word-level matches in name
    nameWords.forEach((word) => {
      if (word.startsWith(term)) score += 15;
      if (word.includes(term)) score += 10;
    });

    // Address matches
    if (place.address.toLowerCase().includes(term)) score += 10;
    addressWords.forEach((word) => {
      if (word.startsWith(term)) score += 8;
      if (word.includes(term)) score += 5;
    });

    // Category/type matches
    if (place.category.includes(term)) score += 15;
    place.types?.forEach((type) => {
      if (type.includes(term)) score += 5;
    });
  });

  // Popularity and rating bonuses
  if (place.isPopular) score += 10;
  if (place.rating > 4) score += place.rating * 2;

  // Distance penalty (if user location available)
  if (userLocation && place.distance) {
    if (place.distance > 1) {
      score -= Math.min(20, (place.distance - 1) * 2);
    }
  }

  return score;
};

const BookingScreen = ({ savedLocations = {}, userLocation }) => {
  // State management
  const navigation = useNavigation();
  const route = useRoute();
  const [activeInput, setActiveInput] = useState(null);
  const [pickupQuery, setPickupQuery] = useState("");
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  // const [isBooking, setIsBooking] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  const [showConfirmationSheet, setShowConfirmationSheet] = useState(false);

  const insets = useSafeAreaInsets();

  const { getCurrentLocationWithAddress } = useLocationService();

  const calculateRoute = async (pickup, dropoff) => {
    try {
      if (!pickup || !dropoff) return;

      console.log("Calculating route between:", {
        pickup: pickup.title,
        dropoff: dropoff.title,
      });

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`,
      );

      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error("Directions request failed");
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      // Calculate fare (adjust formula as needed)
      const baseFare = 30; // PHP
      const ratePerKm = 5; // PHP per kilometer
      const distanceInKm = leg.distance.value / 1000;
      const additionalKm = Math.max(0, distanceInKm - 1);
      const fare = Math.ceil(baseFare + additionalKm * ratePerKm);

      const routeInfo = {
        distance: distanceInKm,
        duration: leg.duration.value / 60, // Convert to minutes
        fare: fare,
        coordinates: decodeDirectionsToCoordinates(data),
      };

      console.log("Route calculated:", routeInfo);
      setRouteInfo(routeInfo);
    } catch (error) {
      console.error("Error calculating route:", error);
      showMessage({
        message: "Route Calculation Failed",
        description: "Unable to calculate route. Please try again.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (selectedPickup && selectedDropoff) {
      calculateRoute(selectedPickup, selectedDropoff);
    }
  }, [selectedPickup, selectedDropoff]);

  // useEffect(() => {
  //   if (route.params?.pickupLocation) {
  //     const { pickupLocation } = route.params;
  //     setSelectedPickup(pickupLocation);
  //     setPickupQuery(pickupLocation.title || "");
  //   }
  //   if (route.params?.dropoffLocation) {
  //     const { dropoffLocation } = route.params;
  //     setSelectedDropoff(dropoffLocation);
  //     setDropoffQuery(dropoffLocation.title);
  //   }
  // }, [route.params]);

  useEffect(() => {
    if (route.params?.pickupLocation) {
      setSelectedPickup(route.params.pickupLocation);
    }
    if (route.params?.dropoffLocation) {
      setSelectedDropoff(route.params.dropoffLocation);
    }
    if (route.params?.routeInfo) {
      setRouteInfo(route.params.routeInfo);
    }
  }, [route.params]);

  // const useBackHandler = (handler) => {
  //   useEffect(() => {
  //     const backHandler = BackHandler.addEventListener(
  //       "hardwareBackPress",
  //       () => {
  //         if (handler()) {
  //           return true;
  //         }
  //         return false;
  //       },
  //     );
  //
  //     return () => backHandler.remove();
  //   }, [handler]);
  // };
  //
  // const handleBackPress = useCallback(() => {
  //   if (visible) {
  //     onDismiss();
  //     return true;
  //   }
  //   return false;
  // }, [visible, onDismiss]);
  //
  // useBackHandler(handleBackPress);

  // Calculate distance between coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Handle search with debouncing
  const handleSearch = async (text, type) => {
    if (type === "pickup") {
      setPickupQuery(text);
    } else {
      setDropoffQuery(text);
    }
    setActiveInput(type);

    if (searchDebounce) clearTimeout(searchDebounce);

    if (text.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchDebounce(
      setTimeout(async () => {
        setIsLoading(true);
        try {
          const searchTerms = text
            .toLowerCase()
            .split(/[\s,]+/)
            .filter((term) => term.length >= 2)
            .slice(0, 3);

          if (searchTerms.length === 0) {
            setSearchResults([]);
            return;
          }

          const queries = searchTerms.map((term) =>
            firestore()
              .collection("paniqui_places")
              .where("searchKeywords", "array-contains", term)
              .limit(20)
              .get(),
          );

          const snapshots = await Promise.all(queries);
          const resultsMap = new Map();

          snapshots.forEach((snapshot) => {
            snapshot.docs.forEach((doc) => {
              if (!resultsMap.has(doc.id)) {
                const place = {
                  id: doc.id,
                  ...doc.data(),
                };

                if (userLocation && place.coordinates) {
                  place.distance = calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    place.coordinates.latitude,
                    place.coordinates.longitude,
                  );
                }

                resultsMap.set(doc.id, place);
              }
            });
          });

          let results = Array.from(resultsMap.values()).map((place) => ({
            ...place,
            searchScore: calculateSearchScore(place, searchTerms, userLocation),
          }));

          results.sort((a, b) => b.searchScore - a.searchScore);
          results = results.slice(0, 10);

          setSearchResults(results);
        } catch (error) {
          console.error("Error searching places:", error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    );
  };

  // Handle location selection
  const handleLocationSelect = (place) => {
    try {
      const location = {
        latitude: place.coordinates.latitude,
        longitude: place.coordinates.longitude,
        title: place.name,
        description: place.address,
        distance: place.distance,
      };

      if (activeInput === "pickup") {
        setSelectedPickup(location);
        setPickupQuery(place.name);
      } else {
        setSelectedDropoff(location);
        setDropoffQuery(place.name);
      }

      setSearchResults([]);
      setActiveInput(null);
    } catch (error) {
      console.error("Error handling location selection:", error);
    }
  };

  const handleCurrentLocationPress = async () => {
    if (isLocating) return;
    setIsLocating(true);

    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        const locationForInput = {
          latitude: locationData.coordinates.latitude,
          longitude: locationData.coordinates.longitude,
          title: locationData.name,
          description: locationData.address,
          isCurrentLocation: true,
        };

        setSelectedPickup(locationForInput);
        setPickupQuery(locationData.name);
      }
    } catch (error) {
      console.error("Error getting current location:", error);
    } finally {
      setIsLocating(false);
      setActiveInput(null);
      setSearchResults([]);
    }
  };

  // Component for search skeleton loading state
  const SearchSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.skeletonItem}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );

  const ResultItem = ({ item, onPress }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => onPress(item)}>
      <MaterialCommunityIcons
        name={item.category === "shopping_mall" ? "store" : "map-marker"}
        size={24}
        color={colors.text}
      />
      <View style={styles.resultContent}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultAddress} numberOfLines={1}>
          {item.address}
          {item.distance && ` • ${item.distance.toFixed(1)} km`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Component for search results
  const SearchResults = () => {
    const renderItem = ({ item }) => (
      <ResultItem item={item} onPress={handleLocationSelect} />
    );

    const ListEmptyComponent = () => (
      <Text style={styles.noResults}>No places found</Text>
    );

    const ListHeaderComponent = () => (
      <Text style={styles.sectionTitle}>
        Search Results{" "}
        {searchResults.length > 0 ? `(${searchResults.length})` : ""}
      </Text>
    );

    const keyExtractor = (item) => item.id;

    return (
      <FlatList
        data={searchResults}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={ListEmptyComponent}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.searchResultsContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    );
  };

  // Component for saved places
  const SavedPlaces = () => (
    <View style={styles.savedPlaces}>
      <Text style={styles.sectionTitle}>Saved Places</Text>

      <TouchableOpacity style={styles.savedPlaceItem}>
        <View style={styles.savedPlaceIcon}>
          <MaterialCommunityIcons name="home" size={24} color={colors.text} />
        </View>
        <View style={styles.savedPlaceContent}>
          <Text style={styles.savedPlaceTitle}>Home</Text>
          <Text style={styles.savedPlaceAddress}>
            {savedLocations.home?.address || "Add home location"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.gray}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.savedPlaceItem}>
        <View style={styles.savedPlaceIcon}>
          <MaterialCommunityIcons
            name="briefcase"
            size={24}
            color={colors.text}
          />
        </View>
        <View style={styles.savedPlaceContent}>
          <Text style={styles.savedPlaceTitle}>Work</Text>
          <Text style={styles.savedPlaceAddress}>
            {savedLocations.work?.address || "Add work location"}
          </Text>
        </View>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.gray}
        />
      </TouchableOpacity>
    </View>
  );

  const handleRouteConfirm = () => {
    console.log("Route confirm pressed", {
      hasPickup: !!selectedPickup,
      hasDropoff: !!selectedDropoff,
      hasRouteInfo: !!routeInfo,
    });

    if (!selectedPickup || !selectedDropoff) {
      showMessage({
        message: "Incomplete Route",
        description: "Please select both pickup and drop-off locations",
        type: "warning",
      });
      return;
    }

    if (!routeInfo) {
      showMessage({
        message: "Route Not Ready",
        description: "Please wait while we calculate the route",
        type: "warning",
      });
      return;
    }

    console.log("Opening confirmation sheet with data:", {
      pickup: selectedPickup,
      dropoff: selectedDropoff,
      routeInfo: routeInfo,
    });

    setShowConfirmationSheet(true);
  };

  useEffect(() => {
    console.log("Confirmation sheet visibility changed:", {
      showConfirmationSheet,
      hasPickup: !!selectedPickup,
      hasDropoff: !!selectedDropoff,
      hasRouteInfo: !!routeInfo,
    });
  }, [showConfirmationSheet, selectedPickup, selectedDropoff, routeInfo]);

  const handleConfirmationClose = () => {
    setShowConfirmationSheet(false);
  };

  // Handle final booking confirmation
  const handleBookingConfirm = (booking) => {
    // Handle successful booking
    navigation.navigate("Dashboard", {
      newBooking: true,
      bookingId: booking.id,
    });
  };

  useEffect(() => {
    console.log("showConfirmationSheet changed:", showConfirmationSheet);
  }, [showConfirmationSheet]);

  // const handleSheetClose = useCallback(() => {
  //   if (bottomSheetRef.current) {
  //     setIsBottomSheetVisible(false);
  //     bottomSheetRef.current.dismiss();
  //   }
  // }, []);

  // Back handler
  // useEffect(() => {
  //   const backHandler = BackHandler.addEventListener(
  //     "hardwareBackPress",
  //     () => {
  //       if (isBottomSheetVisible) {
  //         handleSheetClose();
  //         return true;
  //       }
  //       return false;
  //     },
  //   );
  //
  //   return () => backHandler.remove();
  // }, [isBottomSheetVisible, handleSheetClose]);

  // Add to the end of your JSX right before the closing View tag
  // const renderConfirmButton = () => {
  //   if (selectedPickup && selectedDropoff) {
  //     return (
  //       <TouchableOpacity
  //         style={styles.confirmButton}
  //         onPress={handleConfirmBooking}
  //       >
  //         <Text style={styles.confirmButtonText}>Confirm Location</Text>
  //       </TouchableOpacity>
  //     );
  //   }
  //   return null;
  // };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.bottomSheet, { paddingTop: insets.top }]}>
        <AppHeader />
        <View style={styles.container}>
          {/* Search Inputs */}
          <View style={styles.headerSection}>
            <Text style={styles.title}>Where to?</Text>

            <TextInput
              mode="outlined"
              placeholder="Pick up from?"
              value={pickupQuery}
              autoFocus={true}
              onChangeText={(text) => handleSearch(text, "pickup")}
              onFocus={() => setActiveInput("pickup")}
              left={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={24}
                      color={colors.primary}
                    />
                  )}
                />
              }
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              placeholder="Drop off to?"
              value={dropoffQuery}
              onChangeText={(text) => handleSearch(text, "dropoff")}
              onFocus={() => setActiveInput("dropoff")}
              left={
                <TextInput.Icon
                  icon={() => (
                    <MaterialCommunityIcons
                      name="map-marker-check"
                      size={24}
                      color={colors.secondary}
                    />
                  )}
                />
              }
              style={styles.input}
            />

            {/* Use Current Location Button */}
            <TouchableOpacity
              style={styles.currentLocationButton}
              onPress={handleCurrentLocationPress}
              disabled={isLocating}
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={24}
                color={isLocating ? colors.gray : colors.gray}
              />
              <Text
                style={[
                  styles.currentLocationText,
                  isLocating && styles.currentLocationTextDisabled,
                ]}
              >
                {isLocating ? "Getting location..." : "Use my current location"}
              </Text>
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          {/* Scrollable Content Section */}
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            bounces={true}
            overScrollMode="never"
          >
            {/* Search Results Section */}
            {(activeInput || searchResults.length > 0) && (
              <>
                {isLoading ? (
                  <View style={styles.searchResultsSection}>
                    <SearchSkeleton />
                  </View>
                ) : searchResults.length > 0 ? (
                  <View style={styles.searchResultsSection}>
                    <Text style={styles.sectionTitle}>
                      Search Results ({searchResults.length})
                    </Text>
                    {searchResults.map((item) => (
                      <ResultItem
                        key={item.id}
                        item={item}
                        onPress={handleLocationSelect}
                      />
                    ))}
                  </View>
                ) : activeInput && !isLoading ? (
                  <Text style={styles.noResults}>No places found</Text>
                ) : null}
              </>
            )}
            <View style={styles.savedPlacesSection}>
              <SavedPlaces />
            </View>
          </ScrollView>
          {/* Bottom Button */}
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.mapPickerLink}
              onPress={() =>
                navigation.navigate("LocationPicker", {
                  initialPickup: selectedPickup,
                  initialDropoff: selectedDropoff,
                  activeInput,
                })
              }
            >
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={24}
                color={colors.textMid}
                style={styles.linkIcon}
              />
              <Text style={styles.mapPickerText}>Choose from map</Text>
            </TouchableOpacity>
            <CustomButton
              title="Confirm Route"
              onPress={handleRouteConfirm}
              disabled={!selectedPickup || !selectedDropoff}
              style={styles.confirmButton}
            />
          </View>
        </View>
        {/* Booking Confirmation Sheet */}
        <BookingConfirmationSheet
          visible={showConfirmationSheet}
          onDismiss={() => setShowConfirmationSheet(false)}
          pickup={selectedPickup}
          dropoff={selectedDropoff}
          routeInfo={routeInfo}
          navigation={navigation}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  mapPickerLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 8,
  },
  linkIcon: {
    marginRight: 8,
  },
  mapPickerText: {
    color: colors.textMid,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  bottomButtonContainer: {
    padding: 16,
    paddingBottom: 20,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.gray + "20",
  },
  confirmButton: {
    width: "100%",
  },
  searchResultsContainer: {
    // Base styles for the animated container
    backgroundColor: colors.background,
  },

  searchResultsSection: {
    paddingHorizontal: 20,
  },
  bottomSheet: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  handleIndicator: {
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.background,
    marginBottom: 12,
    borderRadius: 8,
  },
  divider: {
    // marginVertical: 16,
    backgroundColor: colors.gray + "20",
    height: 1,
  },

  // Current Location Button
  currentLocationTextDisabled: {
    color: colors.gray,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginVertical: 8,
  },
  currentLocationText: {
    marginLeft: 12,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.gray,
  },

  headerSection: {
    // paddingVertical: 20,
    backgroundColor: colors.background,
    zIndex: 1, // Ensure header stays on top
  },
  scrollContent: {
    flex: 1,
  },
  searchResultsSection: {
    paddingHorizontal: 20,
  },
  savedPlacesSection: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  bottomPadding: {
    paddingBottom: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
    backgroundColor: colors.background,
  },
  noResults: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.gray,
    marginTop: 20,
    paddingHorizontal: 20,
  },

  // Search Results Section
  searchResults: {
    flex: 1,
  },
  searchResultsContent: {
    flexGrow: 1,
    paddingBottom: 20, // Add bottom padding for last item
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
    backgroundColor: colors.background, // Add background color
  },
  resultContent: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 2,
  },
  resultAddress: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },
  noResults: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.gray,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
    marginLeft: 4,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  savedPlaceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
  },
  savedPlaceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.gray + "40",
    marginRight: 12,
  },
  savedPlaceContent: {
    flex: 1,
  },
  savedPlaceTitle: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 2,
  },
  savedPlaceAddress: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.gray,
  },

  // Loading Skeleton
  skeletonContainer: {
    flex: 1,
    marginTop: 8,
  },
  skeletonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray + "20",
  },
  skeletonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray + "40",
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    width: "70%",
    height: 16,
    backgroundColor: colors.gray + "40",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: "90%",
    height: 14,
    backgroundColor: colors.gray + "30",
    borderRadius: 4,
  },

  // Input Icons
  inputIcon: {
    marginRight: 8,
  },
  inputIconContainer: {
    marginLeft: 8,
  },

  // Rating Section in Results
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.gray,
    marginLeft: 4,
  },

  // Distance Badge
  distanceBadge: {
    position: "absolute",
    right: 4,
    top: 12,
    backgroundColor: colors.gray + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  // TextInput Styles
  textInputOutline: {
    borderColor: colors.gray + "40",
    borderRadius: 8,
  },
  textInputOutlineHover: {
    borderColor: colors.primary,
  },
  textInputOutlineFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Clear Button
  clearButton: {
    padding: 8,
  },
  clearIcon: {
    color: colors.gray,
  },
});

export default BookingScreen;
