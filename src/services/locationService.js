import * as Location from 'expo-location';

const LOCATION_TIMEOUT_MS = 8000;

// Redondea a ~1 km para no enviar la posición exacta.
const roundCoordinate = (value) => Math.round(value * 100) / 100;

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(() => resolve(null), ms))]);

export const getApproximateUserLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { location: null, reason: 'denied' };

    const position =
      (await Location.getLastKnownPositionAsync()) ||
      (await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LOCATION_TIMEOUT_MS
      ));
    if (!position?.coords) return { location: null, reason: 'unavailable' };

    return {
      location: {
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
      },
      reason: null,
    };
  } catch {
    return { location: null, reason: 'unavailable' };
  }
};
