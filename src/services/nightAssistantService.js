export const MAX_ASSISTANT_HISTORY = 6;
const MAX_ASSISTANT_MESSAGE_LENGTH = 400;

export const isAssistantHelpQuery = (message) => {
  const normalized = String(message || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return [
    'que podes hacer',
    'que puedes hacer',
    'en que me podes ayudar',
    'en que me puedes ayudar',
    'en que te puedo ayudar',
    'como me podes ayudar',
    'como me puedes ayudar',
    'para que servis',
  ].some((phrase) => normalized.includes(phrase));
};

export const getAssistantHelpReply = (message) => {
  if (!isAssistantHelpQuery(message)) return null;

  return 'Puedo ayudarte a encontrar salidas por ciudad, fecha o música, y mostrarte opciones próximas. Si no sabés qué elegir, contame qué tipo de noche te gustaría. Si no tengo cargados precios o edades, te lo voy a decir.';
};

export const buildAssistantHistory = (messages) =>
  messages
    .filter((message) =>
      message.id !== 'welcome' &&
      (message.role === 'user' || message.role === 'assistant') &&
      !message.isError
    )
    .slice(-MAX_ASSISTANT_HISTORY)
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').slice(0, MAX_ASSISTANT_MESSAGE_LENGTH),
    }));

export const validateAssistantResponse = (data) => {
  if (!data || typeof data.reply !== 'string' || !data.reply.trim() || !Array.isArray(data.events)) {
    throw new Error('La respuesta de la IA llegó incompleta. Intentá de nuevo.');
  }

  return {
    content: data.reply.trim(),
    events: data.events.filter((event) =>
      event &&
      typeof event.id === 'string' &&
      typeof event.title === 'string'
    ).slice(0, 3),
    followUps: Array.isArray(data.follow_ups)
      ? data.follow_ups
        .filter((item) => typeof item === 'string' && item.trim())
        .map((item) => item.trim().slice(0, 60))
        .slice(0, 3)
      : [],
  };
};

export const getAssistantErrorMessage = async (error) => {
  if (error?.context?.status === 404) {
    return 'El asistente de IA todavía no está publicado en el servidor.';
  }

  if (error?.context && typeof error.context.json === 'function') {
    try {
      const responseBody = await error.context.clone().json();
      if (typeof responseBody?.error === 'string') return responseBody.error;
    } catch {
      return error.message || 'No pude consultar el asistente. Intentá de nuevo.';
    }
  }
  return error?.message || 'No pude consultar el asistente. Intentá de nuevo.';
};
