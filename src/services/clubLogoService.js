export const getClubLogoStoragePath = (logoUrl) => {
  if (!logoUrl) return null;

  try {
    const marker = '/storage/v1/object/public/event-images/';
    const pathname = new URL(logoUrl).pathname;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const path = decodeURIComponent(pathname.slice(markerIndex + marker.length));
    return /^flyers\/[^/]+-club-logo\.jpg$/.test(path) ? path : null;
  } catch {
    return null;
  }
};
