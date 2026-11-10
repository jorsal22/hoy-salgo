export const getMapsSearchUrl = ({ name, address, neighborhood, city }) => {
  const locationParts = [name, address, neighborhood, city]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim());

  if (locationParts.length === 0) return null;

  const searchQuery = [...locationParts, 'Uruguay'].join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;
};
