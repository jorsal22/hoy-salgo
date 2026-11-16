import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { supabase } from '../config/supabase';
import { filterUpcomingEvents, formatEventDate } from '../services/eventDateService';
import { filterVerifiedEvents } from '../services/eventVerificationService';
import { fetchAllPages } from '../services/paginationService';
import { recordTicketClick } from '../services/analyticsService';
import ExpandableText from '../components/ExpandableText';
import { getTicketShareLine, normalizeTicketUrl, openTrackedTicketUrl } from '../services/ticketUrlService';
import { getMapsSearchUrl } from '../services/mapsService';
import {
  buildAssistantHistory,
  getAssistantHelpReply,
  getAssistantErrorMessage,
  validateAssistantResponse,
} from '../services/nightAssistantService';
import { asksForNearby, searchAssistantEvents } from '../services/nightAssistantSearchService';
import { getApproximateUserLocation } from '../services/locationService';

const QUICK_PROMPTS = [
  'Sorprendeme con un plan',
  '¿Qué hay para hacer hoy?',
  'Electrónica en Punta del Este',
  'Fiestas de Año Nuevo',
];

const ASSISTANT_TIMEOUT_MS = 15_000;
const EVENTS_TIMEOUT_MS = 8_000;

let nextMessageId = 0;

const createMessageId = () => {
  nextMessageId += 1;
  return `${Date.now()}-${nextMessageId}`;
};

const shareAssistantEvent = async (event, ticketUrl) => {
  const where = [event.neighborhood, event.city].filter(Boolean).join(', ');
  const lines = [
    `🎉 *${event.title}*`,
    event.venue_name ? `🏠 ${event.venue_name}` : null,
    where ? `📍 ${where}` : null,
    event.event_date ? `🗓️ ${formatEventDate(event.event_date)}` : null,
    event.age_range ? `🔞 ${event.age_range}` : null,
    getTicketShareLine(ticketUrl),
    '',
    '_Encontrado en Hoy Salgo — tu guía para salir en Uruguay_',
  ].filter((line) => line !== null).join('\n');
  const text = encodeURIComponent(lines);
  try {
    const native = `whatsapp://send?text=${text}`;
    await Linking.openURL((await Linking.canOpenURL(native)) ? native : `https://wa.me/?text=${text}`);
  } catch {
    Alert.alert('Error', 'No se pudo abrir WhatsApp.');
  }
};

function AssistantEventCard({ event: baseEvent }) {
  const [details, setDetails] = useState(null);
  const event = details ? { ...baseEvent, ...details.event } : baseEvent;
  const ticketUrl = normalizeTicketUrl(event.ticket_url);
  const mapUrl = getMapsSearchUrl({
    name: event.venue_name,
    address: details?.address,
    neighborhood: event.neighborhood,
    city: event.city,
  });

  useEffect(() => {
    let active = true;
    supabase
      .from('events')
      .select('description, neighborhood, age_range, clubs(address)')
      .eq('id', baseEvent.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        const { clubs, ...rest } = data;
        const club = Array.isArray(clubs) ? clubs[0] : clubs;
        setDetails({ event: rest, address: club?.address || null });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [baseEvent.id]);

  const openMap = () => {
    if (mapUrl) Linking.openURL(mapUrl).catch(() => Alert.alert('Error', 'No se pudo abrir el mapa.'));
  };

  const openTicketPage = async () => {
    if (!ticketUrl) return;
    try {
      await openTrackedTicketUrl(ticketUrl, event.id, (url) => Linking.openURL(url), recordTicketClick);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir la ticketera',
        error.message || 'Revisá tu conexión e intentá de nuevo.'
      );
    }
  };

  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventDate}>{formatEventDate(event.event_date)}</Text>
      <Text style={styles.eventTitle}>{event.title || 'Evento'}</Text>
      <Text style={styles.eventVenue}>
        {[event.venue_name, event.neighborhood, event.city].filter(Boolean).join(' · ') || 'Lugar a confirmar'}
      </Text>
      {details?.address ? <Text style={styles.eventAddress}>📍 {details.address}</Text> : null}
      {event.description ? (
        <ExpandableText text={event.description} lines={4} style={styles.eventDescription} />
      ) : null}
      {event.category ? (
        <Text style={styles.eventCategory}>
          {[event.category, event.age_range].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      {ticketUrl ? (
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel={`Ver entradas para ${event.title || 'el evento'}`}
          onPress={openTicketPage}
          style={styles.ticketButton}
        >
          <Text style={styles.ticketButtonText}>Ver entradas</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.missingLink}>No hay enlace de entradas cargado.</Text>
      )}
      <View style={styles.actionRow}>
        {mapUrl ? (
          <TouchableOpacity accessibilityRole="button" onPress={openMap} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>📍 Cómo llegar</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => shareAssistantEvent(event, ticketUrl)}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>💬 Compartir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChatMessage({ message, onFollowUp }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.messageRow, isUser && styles.userMessageRow]}>
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {message.isFallback ? (
          <Text style={styles.fallbackLabel}>BÚSQUEDA DIRECTA · IA NO DISPONIBLE</Text>
        ) : null}
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>
          {message.content}
        </Text>
        {!isUser && message.events?.length
          ? message.events.map((event) => (
            <AssistantEventCard key={event.id} event={event} />
          ))
          : null}
        {!isUser && message.followUps?.length ? (
          <View style={styles.followUps}>
            {message.followUps.map((text) => (
              <TouchableOpacity
                accessibilityRole="button"
                key={text}
                onPress={() => onFollowUp?.(text)}
                style={styles.promptChip}
              >
                <Text style={styles.promptText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function NightAssistantScreen({ onBack }) {
  const [messages, setMessages] = useState([{
    id: 'welcome',
    role: 'assistant',
    content: '¡Hola! Soy tu conserje de salidas. Conozco los boliches y fiestas de todo Uruguay con entradas verificadas. Contame: ¿qué ganas tenés hoy, algo para bailar o algo más tranqui? ¿Y en qué zona?',
  }]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const eventsCacheRef = useRef(null);
  const scrollRef = useRef(null);
  const [listening, setListening] = useState(false);

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript;
    if (transcript) setDraft(transcript.slice(0, 400));
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error !== 'aborted' && event.error !== 'no-speech') {
      Alert.alert('Dictado no disponible', 'No pude usar el micrófono. Podés escribir tu consulta.');
    }
  });

  const toggleListening = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso del micrófono', 'Activá el micrófono para dictar tu consulta o escribila a mano.');
      return;
    }
    ExpoSpeechRecognitionModule.start({ lang: 'es-UY', interimResults: true, continuous: false });
  };
  const loadEventsForFallback = async () => {
    if (eventsCacheRef.current) return eventsCacheRef.current;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EVENTS_TIMEOUT_MS);
    try {
      const data = await fetchAllPages((from, to) => supabase
        .from('events')
        .select('id, title, venue_name, event_date, event_end_date, city, neighborhood, age_range, ticket_price_uyu, category, club_id, ticket_url, verification_status')
        .eq('verification_status', 'verified')
        .order('event_date', { ascending: true })
        .range(from, to)
        .abortSignal(controller.signal));
      const upcoming = filterUpcomingEvents(filterVerifiedEvents(data));
      eventsCacheRef.current = upcoming;
      return upcoming;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const sendMessage = async (value) => {
    const message = value.trim();
    if (!message || sendingRef.current) return;

    sendingRef.current = true;
    const history = buildAssistantHistory(messages);
    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: 'user', content: message },
    ]);
    setDraft('');
    setSending(true);

    try {
      let answer;
      let location = null;
      let locationReason = null;
      if (asksForNearby(message)) {
        ({ location, reason: locationReason } = await getApproximateUserLocation());
      }
      const locationNote = locationReason === 'denied'
        ? ' Para buscar cerca tuyo necesito el permiso de ubicación; podés activarlo en los ajustes del teléfono o decirme tu ciudad o barrio.'
        : locationReason === 'unavailable'
        ? ' No pude obtener tu ubicación; decime tu ciudad o barrio.'
        : '';
      const helpReply = getAssistantHelpReply(message);
      if (helpReply) {
        answer = { content: helpReply, events: [] };
      } else {
        try {
          const { data, error } = await supabase.functions.invoke('night-assistant', {
            body: { message, history, ...(location ? { location } : {}) },
            timeout: ASSISTANT_TIMEOUT_MS,
          });
          if (error) throw error;
          answer = validateAssistantResponse(data);
          if (locationNote) answer = { ...answer, content: `${answer.content}${locationNote}` };
        } catch (aiError) {
          let events = [];
          let eventsError = null;
          try {
            events = await loadEventsForFallback();
          } catch (error) {
            eventsError = error;
          }
          const localAnswer = searchAssistantEvents(message, events, undefined, { userLocation: location });
          const busy = aiError?.context?.status === 429;
          const eventsDetail = eventsError
            ? `Tampoco pude consultar los eventos: ${await getAssistantErrorMessage(eventsError)}.`
            : null;
          const intro = busy
            ? 'Estoy con mucha demanda, así que te muestro lo que encontré directo en la cartelera.'
            : `${await getAssistantErrorMessage(aiError)} Busqué directamente en los eventos verificados.`;
          answer = {
            content: [intro, eventsDetail, localAnswer.reply, locationNote.trim()].filter(Boolean).join(' '),
            events: localAnswer.events,
            isFallback: !busy,
          };
        }
      }

      setMessages((current) => [
        ...current,
        { id: createMessageId(), role: 'assistant', ...answer },
      ]);
    } catch (error) {
      const detail = await getAssistantErrorMessage(error);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: `No pude cargar los eventos para responder: ${detail}`,
          isError: true,
        },
      ]);
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Buscá tu próxima salida</Text>
          <Text style={styles.headerSubtitle}>Asistente Hoy Salgo</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.introCard}>
            <Text style={styles.introEyebrow}>HOY SALGO TE AYUDA</Text>
            <Text style={styles.introTitle}>¿En qué te puedo ayudar?</Text>
            <Text style={styles.introText}>
              Contame qué plan tenés en mente —o qué tipo de noche te gustaría— y buscamos opciones por zona, fecha o música.
            </Text>
          </View>

          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              onFollowUp={index === messages.length - 1 && !sending ? sendMessage : undefined}
            />
          ))}

          {messages.length === 1 ? (
            <View style={styles.quickPrompts}>
              {QUICK_PROMPTS.map((prompt) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  key={prompt}
                  onPress={() => sendMessage(prompt)}
                  style={styles.promptChip}
                >
                  <Text style={styles.promptText}>{prompt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          {sending ? (
            <View style={styles.typingIndicator}>
              <ActivityIndicator color="#FF8195" size="small" />
              <Text style={styles.typingText}>Estoy buscando opciones para vos...</Text>
            </View>
          ) : null}

          <Text style={styles.disclaimer}>
            Uso eventos verificados cargados en Hoy Salgo; pueden faltar detalles como precio o edad.
            Si la IA o la conexión no están disponibles, igual intento responder con una búsqueda directa.
            No compartas datos personales.
          </Text>
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            accessibilityLabel="Escribí qué tipo de salida buscás"
            autoCapitalize="sentences"
            multiline
            maxLength={400}
            onChangeText={setDraft}
            onSubmitEditing={() => sendMessage(draft)}
            placeholder="Ej.: algo de electrónica en Punta del Este..."
            placeholderTextColor="#718096"
            returnKeyType="send"
            style={styles.input}
            value={draft}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Detener dictado' : 'Dictar consulta por voz'}
            disabled={sending}
            onPress={toggleListening}
            style={[styles.micButton, listening && styles.micButtonActive]}
          >
            <Text style={styles.micButtonText}>{listening ? '■' : '🎤'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Enviar consulta"
            disabled={!draft.trim() || sending}
            onPress={() => sendMessage(draft)}
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#243149',
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#182235',
  },
  backButtonText: { color: '#FFF', fontSize: 30, lineHeight: 34 },
  headerText: { marginLeft: 12, flex: 1 },
  headerTitle: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  keyboardArea: { flex: 1 },
  messages: { padding: 16, paddingBottom: 10 },
  introCard: {
    backgroundColor: '#111A2A',
    borderColor: '#243149',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  introEyebrow: { color: '#FF8195', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  introTitle: { color: '#FFF', fontSize: 22, lineHeight: 28, fontWeight: '900', marginTop: 7 },
  introText: { color: '#A8B4C7', fontSize: 13, lineHeight: 19, marginTop: 7 },
  messageRow: { alignItems: 'flex-start', marginBottom: 12 },
  userMessageRow: { alignItems: 'flex-end' },
  messageBubble: { maxWidth: '92%', borderRadius: 18, padding: 13 },
  assistantBubble: { backgroundColor: '#182235', borderBottomLeftRadius: 5 },
  userBubble: { backgroundColor: '#D83E60', borderBottomRightRadius: 5 },
  fallbackLabel: { color: '#F6D68A', fontSize: 9, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 },
  messageText: { color: '#E8EDF5', fontSize: 14, lineHeight: 20 },
  userMessageText: { color: '#FFF' },
  quickPrompts: { alignItems: 'flex-start', gap: 8, marginBottom: 16 },
  followUps: { alignItems: 'flex-start', gap: 8, marginTop: 12 },
  promptChip: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2B3951',
    backgroundColor: '#111A2A',
    paddingHorizontal: 13,
  },
  promptText: { color: '#CBD5E1', fontSize: 13, fontWeight: '700' },
  eventCard: {
    backgroundColor: '#101827',
    borderColor: '#30405A',
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginTop: 12,
  },
  eventDate: { color: '#FF9AAB', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  eventTitle: { color: '#FFF', fontSize: 15, lineHeight: 20, fontWeight: '800', marginTop: 6 },
  eventVenue: { color: '#DCE4EF', fontSize: 12, lineHeight: 17, marginTop: 5 },
  eventCategory: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  ticketButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E94F6D',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  ticketButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  eventAddress: { color: '#DCE4EF', fontSize: 12, marginTop: 4 },
  eventDescription: { color: '#B6C2D2', fontSize: 12, lineHeight: 17, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  secondaryButton: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B4C69',
    backgroundColor: '#18233A',
  },
  secondaryButtonText: { color: '#E2E8F0', fontSize: 12, fontWeight: '800' },
  missingLink: { color: '#F6D68A', fontSize: 11, lineHeight: 16, marginTop: 9 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  typingText: { color: '#94A3B8', fontSize: 12 },
  disclaimer: { color: '#64748B', fontSize: 10, lineHeight: 15, marginTop: 8, marginBottom: 6 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#243149',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0D1421',
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 46,
    color: '#FFF',
    backgroundColor: '#182235',
    borderColor: '#2B3951',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    fontSize: 14,
  },
  sendButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#E94F6D',
  },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: '#FFF', fontSize: 25, fontWeight: '800', lineHeight: 29 },
  micButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D3748',
  },
  micButtonActive: { backgroundColor: '#E53E3E' },
  micButtonText: { color: '#FFF', fontSize: 20 },
});
