import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAssistantHistory,
  getAssistantErrorMessage,
  getAssistantHelpReply,
  isAssistantHelpQuery,
  MAX_ASSISTANT_HISTORY,
  validateAssistantResponse,
} from '../src/services/nightAssistantService.js';

test('keeps only the latest user-facing turns and excludes welcome/error messages', () => {
  const shortHistory = buildAssistantHistory([
    { id: 'welcome', role: 'assistant', content: 'Bienvenida' },
    { role: 'user', content: 'hola' },
  ]);
  assert.deepEqual(shortHistory, [{ role: 'user', content: 'hola' }]);

  const messages = [
    { id: 'welcome', role: 'assistant', content: 'Bienvenida' },
    ...Array.from({ length: 8 }, (_, index) => ({
      role: index % 2 ? 'assistant' : 'user',
      content: `mensaje ${index}`,
    })),
    { role: 'assistant', content: 'error', isError: true },
  ];

  const history = buildAssistantHistory(messages);

  assert.equal(history.length, MAX_ASSISTANT_HISTORY);
  assert.deepEqual(history.map((message) => message.content), [
    'mensaje 2',
    'mensaje 3',
    'mensaje 4',
    'mensaje 5',
    'mensaje 6',
    'mensaje 7',
  ]);
});

test('welcomes open-ended help questions with the assistant scope', () => {
  assert.equal(isAssistantHelpQuery('¿En qué me podés ayudar?'), true);
  assert.equal(isAssistantHelpQuery('¿Qué puedes hacer?'), true);
  assert.equal(isAssistantHelpQuery('¿En qué te puedo ayudar?'), true);
  assert.equal(isAssistantHelpQuery('Buscame electrónica en Punta del Este'), false);
  assert.equal(isAssistantHelpQuery('¿Qué hacés esta noche?'), false);
  assert.match(getAssistantHelpReply('¿Qué podés hacer?'), /ciudad, fecha o música/);
  assert.equal(getAssistantHelpReply('Buscame electrónica'), null);
});

test('rejects incomplete AI responses and limits displayed recommendations to three', () => {
  assert.throws(() => validateAssistantResponse(null), /incompleta/);

  const response = validateAssistantResponse({
    reply: 'Estas opciones pueden servirte.',
    events: [
      { id: '1', title: 'Evento 1' },
      { id: '2', title: 'Evento 2' },
      { id: '3', title: 'Evento 3' },
      { id: '4', title: 'Evento 4' },
      { id: 5, title: 'Evento inválido' },
    ],
  });

  assert.equal(response.content, 'Estas opciones pueden servirte.');
  assert.deepEqual(response.events.map((event) => event.id), ['1', '2', '3']);
});

test('explains when the assistant function has not been deployed', async () => {
  assert.equal(
    await getAssistantErrorMessage({ context: { status: 404 } }),
    'El asistente de IA todavía no está publicado en el servidor.'
  );
});
