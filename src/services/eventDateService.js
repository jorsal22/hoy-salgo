
const EVENT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/;

export const serializeEventDate = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const parseEventDate = (value) => {
  const match = EVENT_DATE_PATTERN.exec(value || '');
  if (!match) return null;

  const [, year, month, day, hour = '0', minute = '0'] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day) ||
    date.getHours() !== Number(hour) ||
    date.getMinutes() !== Number(minute)
  ) {
    return null;
  }

  return date;
};

export const getEventExpiryTimestamp = (value) => {
  const date = parseEventDate(value);
  if (!date) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    date.setHours(23, 59, 59, 999);
  }

  return date.getTime();
};

export const isEventExpired = (value, now = Date.now()) => {
  const expiryTimestamp = getEventExpiryTimestamp(value);
  return expiryTimestamp !== null && expiryTimestamp <= now;
};

export const getEventDateKey = (value) =>
  /^\d{4}-\d{2}-\d{2}/.test(value || '') ? value.slice(0, 10) : '';

export const getLocalDateKey = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const getAgeMinimum = (value) => {
  const digits = String(value || '').replace(/[^0-9]/g, '');
  if (digits) return Number(digits);
  return String(value || '').trim().toLowerCase() === 'todas las edades' ? 0 : null;
};

export const matchesAgeFilter = (eventAgeRange, selectedAge) => {
  if (selectedAge === 'Todas') return true;

  const eventAge = getAgeMinimum(eventAgeRange);
  if (selectedAge === 'Todas las edades') return eventAge === 0;

  const selectedAgeMinimum = getAgeMinimum(selectedAge);
  return (
    eventAge !== null &&
    selectedAgeMinimum !== null &&
    eventAge >= selectedAgeMinimum
  );
};

export const formatEventDate = (value) => {
  const date = parseEventDate(value);
  if (!date) return value || 'Fecha a confirmar';

  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

export const formatEventDay = (value) => {
  const date = parseEventDate(value);
  if (!date) return value?.slice(0, 10) || 'Fecha a confirmar';

  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export const sortEventsByDate = (events) => [...events].sort((first, second) => {
  const firstDate = parseEventDate(first.event_date);
  const secondDate = parseEventDate(second.event_date);

  if (firstDate && secondDate) {
    const now = Date.now();
    const firstUpcoming = firstDate.getTime() >= now;
    const secondUpcoming = secondDate.getTime() >= now;
    if (firstUpcoming !== secondUpcoming) return firstUpcoming ? -1 : 1;
    return firstUpcoming
      ? firstDate.getTime() - secondDate.getTime()
      : secondDate.getTime() - firstDate.getTime();
  }

  if (firstDate) return -1;
  if (secondDate) return 1;
  return Date.parse(second.created_at || '') - Date.parse(first.created_at || '');
});

export const sortEventsForDisplay = (events, todayKey = getLocalDateKey()) =>
  [...events].sort((first, second) => {
    const firstKey = getEventDateKey(first.event_date);
    const secondKey = getEventDateKey(second.event_date);
    if (!firstKey) return secondKey ? 1 : 0;
    if (!secondKey) return -1;

    const getDateGroup = (dateKey) =>
      dateKey === todayKey ? 0 : dateKey > todayKey ? 1 : 2;
    const firstGroup = getDateGroup(firstKey);
    const secondGroup = getDateGroup(secondKey);
    if (firstGroup !== secondGroup) return firstGroup - secondGroup;

    const firstFeatured = first.is_featured === true;
    const secondFeatured = second.is_featured === true;
    if (firstFeatured !== secondFeatured) return firstFeatured ? -1 : 1;

    if (firstKey !== secondKey) {
      return firstGroup === 2
        ? secondKey.localeCompare(firstKey)
        : firstKey.localeCompare(secondKey);
    }

    const firstDate = parseEventDate(first.event_date);
    const secondDate = parseEventDate(second.event_date);
    if (firstDate && secondDate) {
      return firstGroup === 2
        ? secondDate.getTime() - firstDate.getTime()
        : firstDate.getTime() - secondDate.getTime();
    }

    return 0;
  });

export const sortDateKeysByRelevance = (dateKeys, todayKey = getLocalDateKey()) =>
  [...dateKeys].sort((first, second) => {
    const getDateGroup = (dateKey) =>
      dateKey === todayKey ? 0 : dateKey > todayKey ? 1 : 2;
    const firstGroup = getDateGroup(first);
    const secondGroup = getDateGroup(second);
    if (firstGroup !== secondGroup) return firstGroup - secondGroup;
    return firstGroup === 2
      ? second.localeCompare(first)
      : first.localeCompare(second);
  });
