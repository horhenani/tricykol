export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const deg2rad = (deg) => deg * (Math.PI / 180);

// Filter bookings by distance from driver
export const filterNearbyBookings = (
  bookings,
  driverLocation,
  maxDistanceKm = 2,
) => {
  return bookings
    .filter((booking) => {
      const distance = calculateDistance(
        driverLocation.latitude,
        driverLocation.longitude,
        booking.pickup.latitude,
        booking.pickup.longitude,
      );
      booking.distance = distance; // Add distance to booking object
      return distance <= maxDistanceKm;
    })
    .sort((a, b) => a.distance - b.distance); // Sort by distance
};

// Check if location is within service area
export const isWithinServiceArea = (location, serviceAreaCenter, radiusKm) => {
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    serviceAreaCenter.latitude,
    serviceAreaCenter.longitude,
  );
  return distance <= radiusKm;
};

// Calculate estimated arrival time
export const calculateETA = (distance, averageSpeedKmH = 20) => {
  const timeHours = distance / averageSpeedKmH;
  return Math.round(timeHours * 60); // Convert to minutes
};
