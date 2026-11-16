const EVENT_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}(?::?\d{2})?)?)?$/i;

export const getAssistantEventTimestamp = (value) => {
  if (typeof value !== 'string') return null;
  const match = EVENT_DATE_PATTERN.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction, zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText || 0);
  const minute = Number(minuteText || 0);
  const second = Number(secondText || 0);
  const millisecond = Number((fraction || '').padEnd(3, '0'));
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(year, month - 1, day);
  calendarDate.setUTCHours(hour, minute, second, millisecond);
  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day ||
    calendarDate.getUTCHours() !== hour ||
    calendarDate.getUTCMinutes() !== minute ||
    calendarDate.getUTCSeconds() !== second ||
    calendarDate.getUTCMilliseconds() !== millisecond
  ) return null;

  if (zone && zone !== 'Z') {
    const digits = zone.slice(1).replace(':', '');
    if (Number(digits.slice(0, 2)) > 23 || Number(digits.slice(2) || '0') > 59) return null;
  }

  const localTime = hourText
    ? `${hourText}:${minuteText}${secondText ? `:${secondText}` : ''}${fraction ? `.${fraction}` : ''}`
    : '23:59:59.999';
  const timestamp = Date.parse(
    `${yearText}-${monthText}-${dayText}T${localTime}${zone || '-03:00'}`
  );
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const getSafeAssistantTicketUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const candidate = /^https?:\/\//i.test(value.trim())
    ? value.trim()
    : `https://${value.trim()}`;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && url.hostname ? url.toString() : null;
  } catch {
    return null;
  }
};
