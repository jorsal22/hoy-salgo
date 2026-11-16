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
  assert.equal(budget.events.length, 3);

  const cost = searchAssistantEvents('¿Cuánto sale una entrada en Punta del Este?', events, now);
  assert.match(cost.reply, /No tengo precios cargados/);
  assert.equal(cost.events.length, 3);
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
