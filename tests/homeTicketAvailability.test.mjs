import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const babel = require('@babel/core');
const React = require('react');
const source = readFileSync(new URL('../src/screens/HomeScreen.js', import.meta.url), 'utf8');
const Dummy = () => null;
const TicketSalesInquiryButton = () => null;
const EventPageButton = () => null;
const defaultModule = (value) => ({ __esModule: true, default: value });
const react = {
  __esModule: true,
  default: React,
  useCallback: (fn) => fn,
  useEffect: () => {},
  useMemo: (fn) => fn(),
  useRef: (value) => ({ current: value }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
};
const rn = Object.fromEntries([
  'ActivityIndicator', 'FlatList', 'Image', 'RefreshControl', 'ScrollView',
  'Text', 'TouchableOpacity', 'View',
].map((name) => [name, name]));
rn.StyleSheet = { create: (styles) => styles };
rn.Alert = { alert() {} };
rn.Linking = { openURL: async () => {} };

const modules = {
  react,
  'react-native': rn,
  'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
  '../config/supabase': { supabase: {} },
  '../constants/eventOptions': { AGE_RANGES: [], CATEGORIES: [], CITIES: [] },
  '../services/eventDateService': {
    formatEventDate: () => '', formatEventDay: () => '', getAgeMinimum: () => null,
    getEventDateKey: () => '', getLocalDateKey: () => '', isEventExpired: () => false,
    matchesAgeFilter: () => true, sortDateKeysByRelevance: (dates) => dates,
    sortEventsForDisplay: (events) => events,
  },
  '../hooks/useCurrentTime': defaultModule(() => Date.now()),
  '../services/mapsService': { getMapsSearchUrl: () => '' },
  '../services/favoriteService': { getFavoriteKey: () => '' },
  '../components/FavoriteButton': defaultModule(Dummy),
  '../components/PromotionWhatsAppButton': defaultModule(Dummy),
  '../components/InstagramButton': defaultModule(Dummy),
  '../components/MyTicketsModal': defaultModule(Dummy),
  '../components/TicketPurchaseModal': defaultModule(Dummy),
  '../components/TicketSalesInquiryButton': defaultModule(TicketSalesInquiryButton),
  '../components/EventPageButton': defaultModule(EventPageButton),
  '../components/DateRangeFilter': defaultModule(Dummy),
  '../components/EventFlyerViewer': defaultModule(Dummy),
  '../constants/clubLogos': { getClubLogoSource: () => null },
  'expo-image': { Image: 'Image' },
  '../services/analyticsService': { recordContentView() {}, recordTicketClick() {} },
  '../services/ticketUrlService': {
    normalizeTicketUrl: (url) => url, getTicketShareLine: () => null,
    openTrackedTicketUrl: async () => {},
  },
  '../services/filterOptionsService': {
    getAvailableFilterOptions: () => ['Todas'], getEventCategoryOptions: () => ['Todas'],
    matchesFilterValue: (a, b) => a === b,
  },
  '../services/paginationService': { fetchAllPages() {} },
  '../services/eventVerificationService': { filterVerifiedEvents: (events) => events },
};

function renderHome(text) {
  const compiled = babel.transformSync(text, {
    babelrc: false,
    configFile: false,
    plugins: [require('@babel/plugin-transform-react-jsx'), require('@babel/plugin-transform-modules-commonjs')],
  }).code;
  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require: (id) => {
      if (!(id in modules)) throw new Error(`Missing mock: ${id}`);
      return modules[id];
    },
    console, URL, URLSearchParams, setTimeout, clearTimeout, AbortController,
  });
  return module.exports.default({ isAuthenticated: true, userId: 'user' });
}

function find(node, predicate) {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;
  for (const child of React.Children.toArray(node.props?.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
  return null;
}

test('hides own tickets while keeping external ticket links available', () => {
  const root = renderHome(source);
  const list = find(root, (node) => node.type === 'FlatList');
  const header = list.props.ListHeaderComponent();
  const event = list.props.renderItem({ item: {
    id: 'event-1', title: 'Evento', ticket_url: 'https://tickets.example',
    ticket_sales_enabled: true, ticket_price_uyu: 100, ticket_capacity: 10,
  } });

  assert.equal(find(header, (node) => node.props?.accessibilityLabel === 'Ver mis entradas'), null);
  assert.ok(find(header, (node) => node.props?.children === 'Cuenta de usuario'));
  assert.equal(find(event, (node) => node.props?.accessibilityLabel === 'Comprar entrada para Evento'), null);
  assert.ok(find(event, (node) => node.props?.accessibilityLabel === 'Ver entradas para Evento'));
});

test('allows the purchase and tickets screens together when sales are enabled', () => {
  const enabledSource = source.replace(
    'const INTERNAL_TICKET_SALES_ENABLED = false;',
    'const INTERNAL_TICKET_SALES_ENABLED = true;',
  );
  assert.notEqual(enabledSource, source);
  const root = renderHome(enabledSource);
  const list = find(root, (node) => node.type === 'FlatList');
  const header = list.props.ListHeaderComponent();
  const event = list.props.renderItem({ item: {
    id: 'event-1', title: 'Evento', ticket_url: 'https://tickets.example',
    ticket_sales_enabled: true, ticket_price_uyu: 100, ticket_capacity: 10,
  } });

  assert.ok(find(header, (node) => node.props?.accessibilityLabel === 'Ver mis entradas'));
  assert.ok(find(event, (node) => node.props?.accessibilityLabel === 'Comprar entrada para Evento'));
  assert.ok(find(event, (node) => node.props?.accessibilityLabel === 'Ver entradas para Evento'));
});

test('passes event details to the organizer inquiry on the home screen', () => {
  const root = renderHome(source);
  const list = find(root, (node) => node.type === 'FlatList');
  const event = list.props.renderItem({ item: {
    id: 'event-1', title: 'Evento', event_date: '2026-11-21',
    venue_name: 'Local', city: 'Montevideo', description: 'Entrada gratuita.',
    ticket_url: null, ticket_sales_enabled: false,
  } });
  const inquiry = find(event, (node) => node.type === TicketSalesInquiryButton);
  assert.equal(inquiry.props.event.title, 'Evento');
  assert.equal(inquiry.props.event.date, '2026-11-21');
  assert.equal(inquiry.props.event.venue, 'Local');
  assert.equal(inquiry.props.event.city, 'Montevideo');
  assert.equal(inquiry.props.event.description, 'Entrada gratuita.');
  assert.equal(inquiry.props.event.ticketUrl, null);
});

test('passes the event ticket page to the flyer link', () => {
  const root = renderHome(source);
  const list = find(root, (node) => node.type === 'FlatList');
  const event = list.props.renderItem({ item: {
    id: 'event-1', title: 'Evento', ticket_url: 'https://tickets.example/evento',
  } });
  const link = find(event, (node) => node.type === EventPageButton);
  assert.equal(link.props.ticketUrl, 'https://tickets.example/evento');
  assert.equal(link.props.title, 'Evento');
});
