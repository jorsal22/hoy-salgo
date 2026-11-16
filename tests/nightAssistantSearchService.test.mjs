import assert from 'node:assert/strict';
import test from 'node:test';
import { searchAssistantEvents } from '../src/services/nightAssistantSearchService.js';

const now = new Date(2026, 10, 13, 12).getTime();
const events = [
  {
    id: 'electronic-pde',
    title: 'Colyn',
    city: 'Punta del Este',
    club_id: 'club-pde',
    category: 'Electrónica',
    event_date: '2026-12-27 23:00:00',
  },
  {
    id: 'party-mvd',
    title: 'Fiesta de Cumbia',
    city: 'Montevideo',
    club_id: 'club-mvd',
    category: 'Cumbia / Reggaeton',
    event_date: '2026-12-31 23:00:00',
  },
  {
    id: 'sunset-pde',
    title: 'Sunset Afro',
    city: 'Punta del Este',
    club_id: 'club-pde',
    category: 'Afro-House / Chill',
    event_date: '2027-01-01 17:00:00',
  },
  {
    id: 'unlinked',
    title: 'Electrónica sin local asociado',
    city: 'Punta del Este',
    club_id: null,
    category: 'Electrónica',
    event_date: '2026-12-28 23:00:00',
  },
];

test('finds natural-language requests and includes related Afro-House events', () => {
  const result = searchAssistantEvents(
    'Buscame electrónica en Punta del Este',
    events,
    now
  );

  assert.deepEqual(result.events.map((event) => event.id), ['electronic-pde', 'sunset-pde', 'unlinked']);
  assert.match(result.reply, /3 opciones/);
});

test('supports date-only requests, New Year, and missing price information', () => {
  const today = searchAssistantEvents('¿Qué hay para hacer hoy?', events, now);
  assert.match(today.reply, /No encuentro eventos cargados para ese día/);
  assert.deepEqual(today.events.map((event) => event.id), ['electronic-pde', 'party-mvd', 'sunset-pde']);

  const newYear = searchAssistantEvents('algo para Año Nuevo en Punta del Este', events, now);
  assert.deepEqual(newYear.events.map((event) => event.id), ['sunset-pde']);

  const budget = searchAssistantEvents('algo barato en Punta del Este', events, now);
  assert.match(budget.reply, /No tengo precios cargados/);
  assert.ok(budget.events.length >= 3);

  const cost = searchAssistantEvents('¿Cuánto sale una entrada en Punta del Este?', events, now);
  assert.match(cost.reply, /No tengo precios cargados/);
  assert.ok(cost.events.length >= 3);
});

test('helps users who do not know what plan to choose', () => {
  const result = searchAssistantEvents('No sé qué hacer, ayudame a elegir', events, now);
  assert.match(result.reply, /próximas opciones/);
  assert.deepEqual(result.events.map((event) => event.id), [
    'electronic-pde',
    'party-mvd',
    'sunset-pde',
  ]);
});

test('explains when there are no verified plans to choose from', () => {
  const result = searchAssistantEvents('No sé qué hacer, ayudame a elegir', [], now);
  assert.match(result.reply, /no hay eventos futuros verificados/);
  assert.deepEqual(result.events, []);
});

const mk = (id, extra) => ({
  id, title: id, city: 'Montevideo', club_id: 'c', category: 'Fiesta', event_date: '2026-12-05 23:00:00', ...extra,
});

test('weekend keeps the current weekend when asked on Saturday or Sunday', () => {
  const list = [mk('sat', { event_date: '2026-11-14 23:00:00' }), mk('next', { event_date: '2026-11-20 23:00:00' })];
  const saturday = new Date(2026, 10, 14, 12).getTime();
  assert.deepEqual(searchAssistantEvents('algo este finde', list, saturday).events.map((e) => e.id), ['sat']);
  assert.deepEqual(searchAssistantEvents('el finde que viene', list, saturday).events.map((e) => e.id), ['next']);
});

test('does not match words by accident', () => {
  const list = [mk('rocha', { title: 'Noche en Rocha', category: 'Fiesta', city: 'Rocha' }), mk('rock', { title: 'Rock Night', category: 'Rock' })];
  assert.deepEqual(searchAssistantEvents('quiero rock', list, now).events.map((e) => e.id), ['rock']);
});

test('respects the year and explicit day in dates', () => {
  const list = [
    mk('a', { event_date: '2027-01-10 23:00:00' }),
    mk('b', { event_date: '2028-01-10 23:00:00' }),
    mk('c', { event_date: '2026-12-15 23:00:00' }),
  ];
  assert.deepEqual(searchAssistantEvents('enero 2028', list, now).events.map((e) => e.id), ['b']);
  assert.deepEqual(searchAssistantEvents('enero', list, now).events.map((e) => e.id), ['a']);
  assert.deepEqual(searchAssistantEvents('15 de diciembre', list, now).events.map((e) => e.id), ['c']);
  assert.deepEqual(searchAssistantEvents('10/01/2027', list, now).events.map((e) => e.id), ['a']);
});

test('filters by age, price and neighborhood', () => {
  const list = [
    mk('adult', { age_range: '+18', ticket_price_uyu: 800, neighborhood: 'Pocitos' }),
    mk('older', { age_range: '+30', ticket_price_uyu: 300, neighborhood: 'Cordón' }),
    mk('free', { age_range: 'Todas las edades', ticket_price_uyu: 0, neighborhood: 'Pocitos' }),
  ];
  assert.deepEqual(searchAssistantEvents('fiesta +18', list, now).events.map((e) => e.id), ['adult']);
  assert.deepEqual(searchAssistantEvents('tengo 20 años', list, now).events.map((e) => e.id), ['adult', 'free']);
  assert.deepEqual(searchAssistantEvents('algo hasta 500 pesos', list, now).events.map((e) => e.id), ['older', 'free']);
  assert.deepEqual(searchAssistantEvents('en Pocitos', list, now).events.map((e) => e.id), ['adult', 'free']);
  const cheap = searchAssistantEvents('algo barato', list, now);
  assert.deepEqual(cheap.events.map((e) => e.id), ['free', 'older', 'adult']);
  assert.match(cheap.reply, /Precios cargados/);
});

test('sorts by proximity when the phone location is available', () => {
  const list = [
    mk('mvd', { city: 'Montevideo', event_date: '2026-12-05 23:00:00' }),
    mk('pde', { city: 'Punta del Este', event_date: '2026-12-06 23:00:00' }),
  ];
  const pdeUser = { latitude: -34.96, longitude: -54.95 };
  const result = searchAssistantEvents('qué hay cerca mío', list, now, { userLocation: pdeUser });
  assert.deepEqual(result.events.map((e) => e.id), ['pde', 'mvd']);
  assert.match(result.reply, /a unos|a menos de 1 km/);
  assert.match(searchAssistantEvents('qué hay cerca mío', list, now).reply, /ciudad o barrio/);
});

test('treats vague requests as open recommendations', () => {
  const result = searchAssistantEvents('algo copado', [mk('a')], now);
  assert.match(result.reply, /próximas opciones/);
});
