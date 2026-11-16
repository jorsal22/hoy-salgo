const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

// Centros aproximados: alcanzan para ordenar por cercanía entre ciudades y barrios.
const CITY_COORDS = {
  montevideo: [-34.9011, -56.1645],
  'punta del este': [-34.9602, -54.95],
  maldonado: [-34.9, -54.957],
  'la barra': [-34.912, -54.87],
  colonia: [-34.4626, -57.84],
  florida: [-34.099, -56.214],
  rocha: [-34.4833, -54.3333],
  salto: [-31.3833, -57.9667],
  'san jose de mayo': [-34.3375, -56.7136],
  trinidad: [-33.5167, -56.9],
  carmelo: [-33.997, -58.285],
  rivera: [-30.9053, -55.5508],
  paysandu: [-32.3214, -58.0756],
  guichon: [-32.3667, -57.2],
  durazno: [-33.3806, -56.5236],
  mercedes: [-33.2524, -58.0305],
  artigas: [-30.4, -56.4667],
  'fray bentos': [-33.1167, -58.3],
  atlantida: [-34.7667, -55.7667],
  tacuarembo: [-31.7167, -55.9833],
  'ciudad de la costa': [-34.8167, -55.95],
  canelones: [-34.5228, -56.2778],
};

const NEIGHBORHOOD_COORDS = {
  centro: [-34.906, -56.188],
  cordon: [-34.905, -56.178],
  'parque rodo': [-34.915, -56.165],
  aguada: [-34.893, -56.19],
  pocitos: [-34.91, -56.15],
  'playa brava': [-34.968, -54.93],
  'ciudad vieja': [-34.9065, -56.2045],
  carrasco: [-34.8855, -56.0625],
};

export const getEventCoordinates = (event) => {
  if (Number.isFinite(event?.latitude) && Number.isFinite(event?.longitude)) {
    return { latitude: event.latitude, longitude: event.longitude };
  }
  const pair =
    NEIGHBORHOOD_COORDS[normalize(event?.neighborhood)] ||
    CITY_COORDS[normalize(event?.neighborhood)] ||
    CITY_COORDS[normalize(event?.city)];
  return pair ? { latitude: pair[0], longitude: pair[1] } : null;
};

export const getDistanceKm = (from, to) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

export const isValidLocation = (location) =>
  Number.isFinite(location?.latitude) &&
  Number.isFinite(location?.longitude) &&
  Math.abs(location.latitude) <= 90 &&
  Math.abs(location.longitude) <= 180;

export const getEventDistanceKm = (event, location) => {
  const coordinates = getEventCoordinates(event);
  return coordinates && isValidLocation(location) ? getDistanceKm(location, coordinates) : null;
};

export const formatDistance = (km) =>
  km < 1 ? 'a menos de 1 km' : `a unos ${Math.round(km)} km`;

// Ordena por tramos de 5 km y, dentro de cada tramo, mantiene el orden por fecha.
export const sortByProximity = (events, location) => {
  if (!isValidLocation(location)) return events;
  const bucket = (event) => {
    const distance = getEventDistanceKm(event, location);
    return distance === null ? Infinity : Math.floor(distance / 5);
  };
  return events
    .map((event, index) => ({ event, index, bucket: bucket(event) }))
    .sort((first, second) => first.bucket - second.bucket || first.index - second.index)
    .map(({ event }) => event);
};
