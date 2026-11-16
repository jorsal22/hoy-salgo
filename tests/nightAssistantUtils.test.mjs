import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAssistantEventTimestamp,
  getSafeAssistantTicketUrl,
} from '../supabase/functions/_shared/nightAssistantUtils.js';

test('parses Uruguay-local events and keeps date-only events through the local day', () => {
  assert.equal(
    getAssistantEventTimestamp('2026-12-27 23:00:00'),
    Date.parse('2026-12-27T23:00:00-03:00')
  );
  assert.equal(
    getAssistantEventTimestamp('2026-12-27'),
    Date.parse('2026-12-27T23:59:59.999-03:00')
  );
  assert.equal(
    getAssistantEventTimestamp('2026-12-27T23:00:00Z'),
    Date.parse('2026-12-27T23:00:00Z')
  );
});

test('rejects invalid event dates and unsafe ticket URLs', () => {
  assert.equal(getAssistantEventTimestamp('2026-02-30 20:00:00'), null);
  assert.equal(getAssistantEventTimestamp('not a date'), null);
  assert.equal(getSafeAssistantTicketUrl('https://tickets.example/abc'), 'https://tickets.example/abc');
  assert.equal(getSafeAssistantTicketUrl('tickets.example/abc'), 'https://tickets.example/abc');
  assert.equal(getSafeAssistantTicketUrl('http://tickets.example/abc'), null);
  assert.equal(getSafeAssistantTicketUrl('javascript:alert(1)'), null);
});
