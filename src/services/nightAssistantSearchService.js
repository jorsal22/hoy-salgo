import { filterUpcomingEvents, getEventDateKey, getLocalDateKey } from './eventDateService.js';

const normalize = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const INTERESTS = [
  {
    queryTerms: ['electronica', 'electronico', 'house', 'techno', 'tech house', 'melodic', 'progressive'],
    eventTerms: ['electron', 'house', 'techno', 'tech house', 'melodic', 'progressive'],
  },
  {
    queryTerms: ['cumbia', 'reggaeton', 'cachengue', 'fiesta', 'perreo', 'boliche', 'hits'],
    eventTerms: ['cumbia', 'reggaeton', 'cachengue', 'fiesta', 'perreo', 'hits', 'party'],
  },
  {
    queryTerms: ['sunset', 'chill', 'afro', 'beach', 'playa', 'tranqui', 'relajado'],
    eventTerms: ['sunset', 'chill', 'afro', 'beach', 'playa', 'relax'],
  },
  {
    queryTerms: ['rock', 'pop', 'indie'],
    eventTerms: ['rock', 'pop', 'indie'],
  },
];

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
]);

const PRICE_TERMS = [
  'barato', 'barata', 'economico', 'economica', 'precio', 'precios',
  'entrada', 'entradas', 'gratis', 'cuanto', 'cuesta', 'cuestan', 'sale',
  'valen', 'vale', 'costo', 'costoso', 'costosa',
];
const AGE_TERMS = ['edad', 'edades', 'mayores', 'menores', '18', '21'];
const NEARBY_TERMS = ['cerca', 'cercano', 'cercana', 'cerca mio', 'cerca de mi', 'ubicacion'];

const getQueryCity = (query, events) => {
  if (query.includes('pde') || query.includes('punta del este')) return 'Punta del Este';
  return events.find((event) => {
    const city = normalize(event.city);
    return city.length > 2 && query.includes(city);
  })?.city || null;
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

  if (query.includes('fin de semana') || query.includes('finde')) {
    const fridayOffset = (5 - today.getDay() + 7) % 7;
    return new Set(
      [0, 1, 2].map((dayOffset) => {
        const date = new Date(today);
        date.setDate(date.getDate() + fridayOffset + dayOffset);
        return getLocalDateKey(date);
      })
    );
  }

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

  const month = query.includes('diciembre')
    ? '12'
    : query.includes('enero')
    ? '01'
    : null;
  if (month) return (event) => getEventDateKey(event.event_date).slice(5, 7) === month;

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
  INTERESTS.find((interest) => interest.queryTerms.some((term) => query.includes(term))) || null;

const matchesInterest = (event, interest) => {
  if (!interest) return true;
  const eventText = normalize(`${event.title} ${event.category}`);
  return interest.eventTerms.some((term) => eventText.includes(term));
};

const getKeywords = (query) => query
  .split(/[^a-z0-9]+/)
  .filter((term) => term.length > 2 && !IGNORED_TERMS.has(term));

const matchesKeywords = (event, keywords) => {
  if (!keywords.length) return true;
  const eventText = normalize(`${event.title} ${event.venue_name} ${event.category} ${event.city}`);
  return keywords.some((term) => eventText.includes(term));
};

const containsAny = (query, terms) => terms.some((term) => query.includes(term));

const localDateMatchesNewYear = (event) => {
  const dateKey = getEventDateKey(event.event_date);
  const month = dateKey.slice(5, 7);
  const day = Number(dateKey.slice(8, 10));
  return (month === '12' && day === 31) || (month === '01' && day <= 2);
};

const isOpenRecommendationRequest = (query) =>
  /\b(no se que hacer|ayudame a elegir|sorprendeme|recomendame algo)\b/.test(query);

export const searchAssistantEvents = (message, sourceEvents, now = Date.now()) => {
  const query = normalize(message);
  const events = filterUpcomingEvents(
    Array.isArray(sourceEvents) ? sourceEvents : [],
    now
  );

  if (isOpenRecommendationRequest(query)) {
    return {
      reply: events.length
        ? '¡Dale! Te muestro las próximas opciones. Si me decís qué música, zona o día preferís, afino la búsqueda.'
        : 'Todavía no hay eventos futuros verificados para recomendarte. Cuando haya, puedo ayudarte a elegir por música, zona o fecha.',
      events: events.slice(0, 3),
    };
  }

  const city = getQueryCity(query, events);
  const interest = getInterest(query);
  const dateFilter = getDateKeys(query, now);
  const newYearFilter = query.includes('ano nuevo') || query.includes('fin de ano');
  const keywords = getKeywords(query);
  const priceAsked = containsAny(query, PRICE_TERMS);
  const ageAsked = containsAny(query, AGE_TERMS);
  const locationAsked = containsAny(query, NEARBY_TERMS);
  const baseMatches = events.filter((event) =>
    (!city || event.city === city) &&
    matchesInterest(event, interest) &&
    matchesKeywords(event, keywords)
  );
  const matches = baseMatches.filter((event) =>
    newYearFilter
      ? localDateMatchesNewYear(event)
      : matchesDate(event, dateFilter)
  );

  let recommendations = matches.slice(0, 3);
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

  if (priceAsked) reply += ' No tengo precios cargados para comparar.';
  if (ageAsked) reply += ' La edad mínima no está cargada; revisala con el organizador.';
  if (locationAsked && !city) reply += ' Decime una ciudad y busco por esa zona.';

  return {
    reply,
    events: recommendations,
  };
};
