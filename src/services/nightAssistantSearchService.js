import {
  filterUpcomingEvents,
  getAgeMinimum,
  getEventDateKey,
  getLocalDateKey,
} from './eventDateService.js';
import {
  formatDistance,
  getEventDistanceKm,
  isValidLocation,
  sortByProximity,
} from './geoService.js';

const MAX_RESULTS = 30;
const WANTS_MANY = /\b(fin de ano|diciembre|noviembre|enero|este mes|esta semana|todo lo que hay|todos los eventos|todas las fiestas|proximos dias|agenda|lista)\b/;

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Coincide palabras completas (con plural simple) para evitar casos como "pop" en "popular".
const hasWord = (text, term) =>
  new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(term)}(?:s|es)?(?![a-z0-9])`).test(text);
// Coincide el comienzo de una palabra, para raíces como "electron" (electrónica, electrónico).
const hasStem = (text, stem) =>
  new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(stem)}`).test(text);

const INTERESTS = [
  {
    queryTerms: ['electronica', 'electronico', 'house', 'techno', 'tech house', 'melodic', 'progressive'],
    eventTerms: ['house', 'techno', 'tech house', 'melodic', 'progressive'],
    eventStems: ['electron'],
  },
  {
    queryTerms: ['cumbia', 'reggaeton', 'cachengue', 'fiesta', 'perreo', 'boliche', 'hits', 'bailar', 'bailable'],
    eventTerms: ['cumbia', 'reggaeton', 'cachengue', 'fiesta', 'perreo', 'hits', 'party'],
  },
  {
    queryTerms: ['sunset', 'chill', 'afro', 'beach', 'playa', 'tranqui', 'tranquilo', 'tranquila', 'relajado'],
    eventTerms: ['sunset', 'chill', 'afro', 'beach', 'playa'],
    eventStems: ['relax'],
  },
  {
    queryTerms: ['rock', 'pop', 'indie'],
    eventTerms: ['rock', 'pop', 'indie'],
  },
];

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const MONTH_ALIASES = { setiembre: 8 };

const IGNORED_TERMS = new Set([
  'algo', 'alguna', 'alguno', 'buscar', 'buscame', 'quiero', 'para', 'hoy', 'manana',
  'esta', 'este', 'fin', 'semana', 'finde', 'que', 'hay', 'hacer', 'salir', 'salida',
  'evento', 'eventos', 'con', 'sin', 'del', 'de', 'la', 'el', 'en', 'un', 'una',
  'mas', 'menos', 'barato', 'barata', 'economico', 'economica', 'precio', 'precios',
  'entrada', 'entradas', 'edad', 'edades', 'cerca', 'cercano', 'cercana', 'zona',
  'diciembre', 'enero', 'verano', 'ano', 'nuevo', 'noche', 'viernes', 'sabado',
  'domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'pde', 'plan', 'planes',
  'musica', 'bueno', 'buena', 'lindo', 'linda', 'copado', 'copada', 'divertido',
  'divertida', 'ayudame', 'ayudar', 'elegir', 'sorprendeme', 'recomendas',
  'recomendame', 'recomendar', 'recomendacion', 'ideas', 'idea', 'cual',
  'cuanto', 'cuesta', 'cuestan', 'sale', 'valen', 'vale', 'minima', 'minimo',
  'mio', 'mia', 'quiero', 'tengo', 'tiene', 'costo', 'costoso', 'costosa', 'gratis',
  'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
  'setiembre', 'octubre', 'noviembre', 'proximo', 'proxima', 'que', 'viene',
  'anos', 'mayores', 'menores', 'mayor', 'menor', 'pesos', 'hasta', 'maximo',
  'todas', 'todos', 'las', 'los', 'por', 'sobre', 'tranquilo', 'cerca',
]);

const PRICE_TERMS = [
  'barato', 'barata', 'economico', 'economica', 'precio', 'precios',
  'entrada', 'entradas', 'gratis', 'cuanto', 'cuesta', 'cuestan', 'sale',
  'valen', 'vale', 'costo', 'costoso', 'costosa',
];
const CHEAP_TERMS = ['barato', 'barata', 'economico', 'economica'];
const AGE_TERMS = ['edad', 'edades', 'mayores', 'menores', 'mayor', 'menor'];
const NEARBY_TERMS = [
  'cerca', 'cercano', 'cercana', 'cerca mio', 'cerca de mi', 'ubicacion',
  'por aca', 'alrededor', 'mas cercano', 'donde estoy',
];

export const asksForNearby = (message) => containsAny(normalize(message), NEARBY_TERMS);

const getMonthIndex = (name) =>
  name in MONTH_ALIASES ? MONTH_ALIASES[name] : MONTHS.indexOf(name);

const pad = (value) => String(value).padStart(2, '0');

const getQueryCity = (query, events) => {
  if (hasWord(query, 'pde') || query.includes('punta del este')) return 'Punta del Este';
  return events.find((event) => {
    const city = normalize(event.city);
    return city.length > 2 && hasWord(query, city);
  })?.city || null;
};

const getQueryNeighborhood = (query, events) => {
  const names = new Set(
    events.map((event) => normalize(event.neighborhood).trim()).filter((name) => name.length > 2)
  );
  return [...names].find((name) => hasWord(query, name)) || null;
};

const getAgeFilter = (query) => {
  const exact = query.match(/(?:\+\s?|mayores?\s+de\s+|mayor\s+de\s+)(\d{2})\b|\b(\d{2})\s?\+/);
  if (exact) return { mode: 'exact', value: Number(exact[1] || exact[2]) };

  const own = query.match(/\b(?:tengo|soy de)\s+(\d{1,2})\b|\b(\d{1,2})\s+anos\b/);
  if (own) return { mode: 'max', value: Number(own[1] || own[2]) };

  if (/\b(todas las edades|sin limite de edad|menores)\b|\bpara menores\b/.test(query)) {
    return { mode: 'exact', value: 0 };
  }
  return null;
};

const matchesAge = (event, ageFilter) => {
  if (!ageFilter) return true;
  const eventAge = getAgeMinimum(event.age_range);
  if (eventAge === null) return false;
  return ageFilter.mode === 'max' ? eventAge <= ageFilter.value : eventAge === ageFilter.value;
};

const getEventPrice = (event) => {
  const raw = event.ticket_price_uyu ?? event.price;
  if (raw === null || raw === undefined || raw === '') return null;
  const price = Number(raw);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

const getPriceFilter = (query) => {
  if (hasWord(query, 'gratis')) return { max: 0 };
  const max = query.match(/\b(?:hasta|menos de|maximo|max)\s*\$?\s*(\d{2,6})\b|\$\s?(\d{2,6})\b|\b(\d{2,6})\s*(?:pesos|uyu)\b/);
  if (max) return { max: Number(max[1] || max[2] || max[3]) };
  return null;
};

const getExplicitDateFilter = (query, today) => {
  const todayKey = getLocalDateKey(today);
  const monthPattern = [...MONTHS, ...Object.keys(MONTH_ALIASES)].join('|');
  const resolveYear = (month, day, year) => {
    if (year) return year;
    const current = today.getFullYear();
    const candidate = `${current}-${pad(month + 1)}-${pad(day)}`;
    return candidate >= todayKey ? current : current + 1;
  };
  const toYear = (value) => {
    const year = Number(value);
    return year < 100 ? 2000 + year : year;
  };

  const named = query.match(
    new RegExp(`\\b(\\d{1,2})(?:\\s+de)?\\s+(${monthPattern})(?:\\s+(?:de\\s+)?(20\\d{2}))?\\b`)
  );
  const numeric = query.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  const dayMatch = named
    ? { day: Number(named[1]), month: getMonthIndex(named[2]), year: named[3] && toYear(named[3]) }
    : numeric
    ? { day: Number(numeric[1]), month: Number(numeric[2]) - 1, year: numeric[3] && toYear(numeric[3]) }
    : null;
  if (dayMatch && dayMatch.month >= 0 && dayMatch.month < 12 && dayMatch.day >= 1 && dayMatch.day <= 31) {
    const year = resolveYear(dayMatch.month, dayMatch.day, dayMatch.year);
    return new Set([`${year}-${pad(dayMatch.month + 1)}-${pad(dayMatch.day)}`]);
  }

  const monthMatch = query.match(
    new RegExp(`\\b(${monthPattern})(?:\\s+(?:de\\s+)?(20\\d{2}))?\\b`)
  );
  if (monthMatch) {
    const month = getMonthIndex(monthMatch[1]);
    const year = monthMatch[2]
      ? Number(monthMatch[2])
      : month >= today.getMonth() ? today.getFullYear() : today.getFullYear() + 1;
    const prefix = `${year}-${pad(month + 1)}`;
    return (event) => getEventDateKey(event.event_date).startsWith(prefix);
  }

  const yearMatch = query.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return (event) => getEventDateKey(event.event_date).startsWith(`${yearMatch[1]}-`);
  }
  return null;
};

const getWeekendKeys = (query, today) => {
  const day = today.getDay();
  const wantsNext = /\b(proximo|proxima|que viene|siguiente)\b/.test(query);
  const inWeekend = day === 5 || day === 6 || day === 0;
  const daysToFriday = (5 - day + 7) % 7;
  let offsets;
  if (inWeekend && !wantsNext) {
    offsets = day === 5 ? [0, 1, 2] : day === 6 ? [0, 1] : [0];
  } else {
    const start = wantsNext && inWeekend ? (daysToFriday || 7) : daysToFriday + (wantsNext ? 7 : 0);
    offsets = [start, start + 1, start + 2];
  }
  return new Set(
    offsets.map((offset) => {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return getLocalDateKey(date);
    })
  );
};

const getDateKeys = (query, now) => {
  const today = new Date(now);
  const todayKey = getLocalDateKey(today);
  if (/\bhoy\b/.test(query) || query.includes('esta noche') || query.includes('tonight')) {
    return new Set([todayKey]);
  }

  if (/\bmanana\b/.test(query)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Set([getLocalDateKey(tomorrow)]);
  }

  if (query.includes('ano nuevo') || query.includes('fin de ano')) {
    return null;
  }

  if (query.includes('fin de semana') || /\bfinde\b/.test(query)) {
    return getWeekendKeys(query, today);
  }

  if (query.includes('esta semana')) {
    return new Set(
      Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(today);
        date.setDate(date.getDate() + offset);
        return getLocalDateKey(date);
      })
    );
  }

  const explicit = getExplicitDateFilter(query, today);
  if (explicit) return explicit;

  const weekdayNames = [
    ['domingo', 0],
    ['lunes', 1],
    ['martes', 2],
    ['miercoles', 3],
    ['jueves', 4],
    ['viernes', 5],
    ['sabado', 6],
  ];
  const weekday = weekdayNames.find(([name]) => new RegExp(`\\b${name}\\b`).test(query));
  if (weekday) {
    const keys = new Set();
    const daysAhead = (weekday[1] - today.getDay() + 7) % 7;
    for (const extraWeek of [0, 7]) {
      const date = new Date(today);
      date.setDate(date.getDate() + daysAhead + extraWeek);
      keys.add(getLocalDateKey(date));
    }
    return keys;
  }

  return null;
};

const matchesDate = (event, dateFilter) => {
  if (!dateFilter) return true;
  const dateKey = getEventDateKey(event.event_date);
  return dateFilter instanceof Set
    ? dateFilter.has(dateKey)
    : dateFilter(event);
};

const getInterest = (query) =>
  INTERESTS.find((interest) => interest.queryTerms.some((term) => hasWord(query, term))) || null;

const matchesInterest = (event, interest) => {
  if (!interest) return true;
  const eventText = normalize(`${event.title} ${event.category}`);
  return (
    interest.eventTerms.some((term) => hasWord(eventText, term)) ||
    (interest.eventStems || []).some((stem) => hasStem(eventText, stem))
  );
};

const INTEREST_QUERY_TERMS = new Set(
  INTERESTS.flatMap((interest) => interest.queryTerms.flatMap((term) => term.split(' ')))
);

const getKeywords = (query, removedPhrases) => {
  let remaining = query;
  for (const phrase of removedPhrases.filter(Boolean)) {
    remaining = remaining.replace(new RegExp(escapeRegExp(phrase), 'g'), ' ');
  }
  return remaining
    .split(/[^a-z0-9]+/)
    .filter((term) =>
      term.length > 2 &&
      !/^\d+$/.test(term) &&
      !IGNORED_TERMS.has(term) &&
      !INTEREST_QUERY_TERMS.has(term) &&
      !PRICE_TERMS.includes(term)
    );
};

const matchesKeywords = (event, keywords) => {
  if (!keywords.length) return true;
  const eventText = normalize(
    `${event.title} ${event.venue_name} ${event.category} ${event.city} ${event.neighborhood}`
  );
  return keywords.some((term) => hasWord(eventText, term));
};

const containsAny = (query, terms) => terms.some((term) => hasWord(query, term));

const localDateMatchesNewYear = (event) => {
  const dateKey = getEventDateKey(event.event_date);
  const month = dateKey.slice(5, 7);
  const day = Number(dateKey.slice(8, 10));
  return (month === '12' && day === 31) || (month === '01' && day <= 2);
};

const isOpenRecommendationRequest = (query) =>
  /\b(no se que hacer|ayudame a elegir|sorprendeme|recomendame algo|que me recomendas|que me recomiendas|estoy aburrido|estoy aburrida|cualquier cosa|lo que sea)\b/.test(query);

const formatPrice = (price) => (price === 0 ? 'gratis' : `$${price}`);

export const searchAssistantEvents = (message, sourceEvents, now = Date.now(), options = {}) => {
  const query = normalize(message);
  const events = filterUpcomingEvents(
    Array.isArray(sourceEvents) ? sourceEvents : [],
    now
  );

  const openReply = () => ({
    reply: events.length
      ? '¡Dale! Te muestro las próximas opciones. Si me decís qué música, zona o día preferís, afino la búsqueda.'
      : 'Todavía no hay eventos futuros verificados para recomendarte. Cuando haya, puedo ayudarte a elegir por música, zona o fecha.',
    events: events.slice(0, 3),
  });

  if (isOpenRecommendationRequest(query)) return openReply();

  const city = getQueryCity(query, events);
  const neighborhood = getQueryNeighborhood(query, events);
  const interest = getInterest(query);
  const dateFilter = getDateKeys(query, now);
  const newYearFilter = query.includes('ano nuevo') || query.includes('fin de ano');
  const ageFilter = getAgeFilter(query);
  const priceFilter = getPriceFilter(query);
  const cheapAsked = containsAny(query, CHEAP_TERMS);
  const keywords = getKeywords(query, [
    city && normalize(city),
    city === 'Punta del Este' ? 'punta del este' : null,
    neighborhood,
  ]);
  const priceAsked = containsAny(query, PRICE_TERMS) || Boolean(priceFilter);
  const ageAsked = containsAny(query, AGE_TERMS) || Boolean(ageFilter);
  const locationAsked = containsAny(query, NEARBY_TERMS);
  const userLocation = isValidLocation(options.userLocation) ? options.userLocation : null;
  const hasUserLocation = Boolean(userLocation);

  const hasCriteria = Boolean(
    city || neighborhood || interest || dateFilter || newYearFilter || keywords.length ||
    ageFilter || priceFilter || priceAsked || ageAsked || locationAsked
  );
  if (!hasCriteria) return openReply();

  const baseMatches = events.filter((event) =>
    (!city || event.city === city) &&
    (!neighborhood || normalize(event.neighborhood).trim() === neighborhood) &&
    matchesInterest(event, interest) &&
    matchesKeywords(event, keywords) &&
    matchesAge(event, ageFilter)
  );
  const dateMatches = baseMatches.filter((event) =>
    newYearFilter
      ? localDateMatchesNewYear(event)
      : matchesDate(event, dateFilter)
  );

  const pricedMatches = priceFilter
    ? dateMatches.filter((event) => {
      const price = getEventPrice(event);
      return price !== null && price <= priceFilter.max;
    })
    : dateMatches;
  const priceFilterApplied = Boolean(priceFilter) && pricedMatches.length > 0;
  let matches = priceFilterApplied ? pricedMatches : dateMatches;

  if (cheapAsked && matches.some((event) => getEventPrice(event) !== null)) {
    const price = (event) => getEventPrice(event) ?? Infinity;
    matches = [...matches].sort((first, second) => price(first) - price(second));
  }
  if (hasUserLocation && (locationAsked || !dateFilter)) {
    matches = sortByProximity(matches, userLocation);
  }

  let recommendations = matches.slice(0, newYearFilter || WANTS_MANY.test(query) ? MAX_RESULTS : 3);
  let reply = '';
  if (matches.length) {
    reply = matches.length === 1
      ? 'Encontré una opción que puede servirte.'
      : `Encontré ${matches.length} opciones; te muestro las más próximas.`;
  } else if (dateFilter || newYearFilter) {
    recommendations = baseMatches.slice(0, 3);
    reply = recommendations.length
      ? 'No encuentro eventos cargados para ese día; estos son los próximos que aparecen.'
      : 'No encuentro eventos que coincidan con ese pedido en los datos cargados.';
  } else {
    reply = 'No encuentro eventos que coincidan con ese pedido. Decime una ciudad, un día o un estilo musical y pruebo de nuevo.';
  }

  if (priceAsked) {
    const priced = recommendations
      .map((event) => [event, getEventPrice(event)])
      .filter(([, price]) => price !== null);
    if (priced.length) {
      reply += ` Precios cargados: ${priced.map(([event, price]) => `${event.title} ${formatPrice(price)}`).join(', ')}.`;
      if (priced.length < recommendations.length) reply += ' Del resto no tengo el precio.';
    } else {
      reply += ' No tengo precios cargados para comparar.';
    }
  }
  if (ageFilter && matches.length) {
    reply += ' Filtré por edad mínima; los eventos sin edad cargada quedaron afuera.';
  } else if (ageFilter) {
    reply += ' Recordá que los eventos sin edad cargada no entran en este filtro.';
  } else if (ageAsked) {
    reply += ' Decime tu edad o "+18" y filtro por edad mínima.';
  }
  if (locationAsked && hasUserLocation && recommendations.length) {
    const distance = getEventDistanceKm(recommendations[0], userLocation);
    if (distance !== null) {
      reply += ` El más cercano queda en ${recommendations[0].city || 'tu zona'}, ${formatDistance(distance)}.`;
    }
  }
  if (locationAsked && !city && !neighborhood && !hasUserLocation) {
    reply += ' Decime una ciudad o barrio y busco por esa zona.';
  }

  return {
    reply,
    events: recommendations,
  };
};
