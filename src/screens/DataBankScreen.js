import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAdminUser } from '../config/admin';
import InstagramButton from '../components/InstagramButton';
import TicketSalesInquiryButton from '../components/TicketSalesInquiryButton';
import { supabase } from '../config/supabase';
import { recordTicketClick } from '../services/analyticsService';
import { getDataBankTicketEntries, getEventPriceDetails } from '../services/dataBankTicketService';
import { filterUpcomingEvents, formatEventDate, getEventExpiryTimestamp } from '../services/eventDateService';
import {
  filterVerifiedEvents,
  isBatchVerifiableEvent,
  normalizeVerificationSourceUrl,
} from '../services/eventVerificationService';
import { normalizeInstagramUrl } from '../services/instagramService';
import { getTicketShareLine, normalizeTicketUrl, openTrackedTicketUrl } from '../services/ticketUrlService';
import useCurrentTime from '../hooks/useCurrentTime';

const CATEGORY_EMOJI = {
  Boliche: '🪩',
  Electrónica: '🎛️',
  'Cumbia / RKT': '🎺',
  'Pub / Bar': '🍺',
  'Fiesta Retro': '📼',
  'Rock / En Vivo': '🎸',
};

const getEmoji = (category) => CATEGORY_EMOJI[category] || '✦';

const getDataBankErrorMessage = (error) => {
  if (['42703', 'PGRST204'].includes(error?.code)) {
    return 'Falta aplicar la migración de verificación de eventos en Supabase.';
  }
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return 'Faltan aplicar migraciones de la base de datos en Supabase.';
  }
  return error?.message || 'No se pudieron cargar los datos.';
};

const shareWhatsApp = async (text) => {
  const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
  try {
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    } else {
      Alert.alert('WhatsApp no está instalado', 'Instalá WhatsApp para compartir.');
    }
  } catch (error) {
    Alert.alert('Error', error.message || 'No se pudo abrir WhatsApp.');
  }
};

const loadEvents = async (isAdmin) => {
  const pageSize = 500;
  const events = [];
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from('events')
      .select('id, title, venue_name, city, neighborhood, category, age_range, instagram_url, description, event_date, event_end_date, ticket_url, ticket_sales_enabled, ticket_price_uyu, club_id, verification_status, verification_source_url, verified_at')
      .order('event_date', { ascending: true })
      .order('id', { ascending: true });
    if (!isAdmin) query = query.eq('verification_status', 'verified');
    const { data, error } = await query.range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = data || [];
    events.push(...page);
    if (page.length < pageSize) break;
  }
  const invalidDates = events.filter((event) => getEventExpiryTimestamp(event.event_date, event.event_end_date) === null).length;
  if (invalidDates) {
    console.warn(`Banco de Datos: ${invalidDates} eventos sin fecha válida no se mostrarán.`);
  }
  return events;
};

const loadDataBankData = async (isAdmin) => {
  const [clubsResult, eventsResult] = await Promise.all([
    supabase
      .from('clubs')
      .select('id, name, city, neighborhood, address, phone, instagram_url')
      .eq('verification_status', 'verified')
      .order('name', { ascending: true }),
    loadEvents(isAdmin),
  ]);

  if (clubsResult.error) throw clubsResult.error;
  return {
    clubs: (clubsResult.data || []).map((club) => ({
      ...club,
      instagram: club.instagram_url,
    })),
    events: (isAdmin ? eventsResult : filterVerifiedEvents(eventsResult)).map((event) => ({
      ...event,
      venue: event.venue_name,
      ageRange: event.age_range,
      instagram: event.instagram_url,
    })),
  };
};

function DataField({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{String(value)}</Text>
    </View>
  );
}

function ShareButton({ text }) {
  return (
    <View style={styles.quickActions}>
      <TouchableOpacity
        style={styles.quickActionBtn}
        onPress={() => shareWhatsApp(text)}
        accessibilityRole="button"
      >
        <Text style={styles.quickActionText}>📤 WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

function TicketButton({ event }) {
  const ticketUrl = normalizeTicketUrl(event.ticket_url);
  const priceDetails = getEventPriceDetails(event);

  const handlePress = async () => {
    if (!ticketUrl) {
      Alert.alert('Precio y condiciones', `${priceDetails}\n\nNo hay enlace de compra disponible.`);
      return;
    }

    try {
      await openTrackedTicketUrl(ticketUrl, event.id, (url) => Linking.openURL(url), recordTicketClick);
    } catch (error) {
      Alert.alert('No se pudo abrir la ticketera', error.message || 'Revisá tu conexión e intentá de nuevo.');
    }
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`${ticketUrl ? 'Abrir entradas de' : 'Ver precio de'} ${event.title}`}
        onPress={handlePress}
        style={styles.ticketButton}
      >
        <Text style={styles.ticketButtonText}>{ticketUrl ? '🎟 Ver entradas' : '🎟 Ver precio'}</Text>
      </TouchableOpacity>
      <TicketSalesInquiryButton event={{
        title: event.title,
        date: event.event_date,
        venue: event.venue_name,
        city: event.city,
        description: event.description,
        ticketUrl: event.ticket_url,
        ticketSalesEnabled: event.ticket_sales_enabled,
      }} />
    </>
  );
}

function ClubCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const fullText = [
    `🏠 ${item.name}`,
    `Ciudad: ${item.city}`,
    item.neighborhood && `Barrio: ${item.neighborhood}`,
    item.address && `Dirección: ${item.address}`,
    item.phone && `Teléfono: ${item.phone}`,
    item.instagram && `Instagram: ${item.instagram}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <View style={styles.card}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.cardHeader}
        activeOpacity={0.75}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconEmoji}>{getEmoji(item.category)}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSub}>
            {[item.neighborhood, item.city].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <Text style={styles.cardChevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.cardBody}>
          <DataField label="Nombre" value={item.name} />
          <DataField label="Ciudad" value={item.city} />
          <DataField label="Barrio" value={item.neighborhood} />
          <DataField label="Dirección" value={item.address} />
          <DataField label="Teléfono" value={item.phone} />
          {item.instagram && !normalizeInstagramUrl(item.instagram) ? (
            <DataField label="Instagram" value="Perfil no disponible" />
          ) : (
            <InstagramButton value={item.instagram} label={item.name} />
          )}
          <Text style={styles.ticketEventsTitle}>PRÓXIMOS EVENTOS CON ENTRADAS O PRECIO</Text>
          {item.ticketEvents.map((event) => (
            <View key={event.id} style={styles.ticketEvent}>
              <Text style={styles.ticketEventTitle}>{event.title}</Text>
              <Text style={styles.ticketEventDate}>{formatEventDate(event.event_date)}</Text>
              <TicketButton event={event} />
            </View>
          ))}
          <ShareButton text={fullText} />
        </View>
      ) : null}
    </View>
  );
}

function EventCard({
  item,
  isAdmin,
  isUpdating,
  isSelected,
  isBatchEligible,
  onToggleSelection,
  onVerificationChange,
}) {
  const [expanded, setExpanded] = useState(false);
  const [sourceUrl, setSourceUrl] = useState(item.verification_source_url || '');
  const fullText = [
    `🎉 ${item.title}`,
    item.event_date && `Fecha: ${formatEventDate(item.event_date)}`,
    item.venue && `Boliche / Local: ${item.venue}`,
    `Ciudad: ${item.city}`,
    item.neighborhood && `Barrio: ${item.neighborhood}`,
    item.category && `Categoría: ${item.category}`,
    item.ageRange && `Edad mínima: ${item.ageRange}`,
    item.instagram && `Instagram: ${item.instagram}`,
    item.description && `Descripción: ${item.description}`,
    getTicketShareLine(item.ticket_url),
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <View style={styles.card}>
      {isAdmin && isBatchEligible ? (
        <TouchableOpacity
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          disabled={isUpdating}
          onPress={() => onToggleSelection(item.id)}
          style={[
            styles.batchSelection,
            isSelected && styles.batchSelectionActive,
            isUpdating && styles.disabledButton,
          ]}
        >
          <Text style={[styles.batchSelectionText, isSelected && styles.batchSelectionTextActive]}>
            {isSelected ? '✓ Seleccionado para aprobar' : '＋ Seleccionar para aprobar'}
          </Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={styles.cardHeader}
        activeOpacity={0.75}
      >
        <View style={[styles.cardIcon, styles.cardIconEvent]}>
          <Text style={styles.cardIconEmoji}>{getEmoji(item.category)}</Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSub}>
            {[item.venue, item.city].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.cardCategory}>
            {[item.event_date && formatEventDate(item.event_date), item.ageRange, item.category]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {isAdmin ? (
            <Text style={styles.verificationBadge}>
              {item.verification_status === 'verified' ? '✓ Verificado' : 'Pendiente de verificar'}
            </Text>
          ) : null}
        </View>
        <Text style={styles.cardChevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.cardBody}>
          <DataField label="Nombre del evento" value={item.title} />
          <DataField label="Fecha y hora" value={item.event_date && formatEventDate(item.event_date)} />
          <DataField label="Boliche / Local" value={item.venue} />
          <DataField label="Ciudad" value={item.city} />
          <DataField label="Barrio" value={item.neighborhood} />
          <DataField label="Categoría" value={item.category} />
          <DataField label="Edad mínima" value={item.ageRange} />
          <DataField label="Instagram" value={item.instagram} />
          <DataField label="Descripción" value={item.description} />
          <TicketButton event={item} />
          {isAdmin ? (
            <View style={styles.verificationPanel}>
              <Text style={styles.verificationTitle}>REVISIÓN Y VISIBILIDAD</Text>
              <Text style={styles.verificationHint}>
                {item.verification_status === 'verified'
                  ? 'Este evento aparece en la cartelera pública.'
                  : 'Seguirá oculto hasta aprobarlo. La fuente debe respaldar todos los datos visibles, incluida la edad y el enlace de entradas.'}
              </Text>
              {item.verification_status === 'verified' ? (
                <DataField label="Fuente verificada" value={item.verification_source_url} />
              ) : (
                <TextInput
                  accessibilityLabel="Enlace de la fuente pública del evento"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isUpdating}
                  keyboardType="url"
                  onChangeText={setSourceUrl}
                  placeholder="https://fuente-oficial-o-ticketera..."
                  placeholderTextColor="#748198"
                  style={styles.verificationInput}
                  value={sourceUrl}
                />
              )}
              <TouchableOpacity
                accessibilityRole="button"
                disabled={isUpdating}
                onPress={() => onVerificationChange(
                  item.id,
                  item.verification_status === 'verified' ? 'pending' : 'verified',
                  sourceUrl
                )}
                style={[
                  styles.verificationButton,
                  item.verification_status === 'verified' && styles.pendingButton,
                  isUpdating && styles.disabledButton,
                ]}
              >
                <Text style={styles.verificationButtonText}>
                  {isUpdating
                    ? 'Guardando…'
                    : item.verification_status === 'verified'
                      ? 'Ocultar y dejar pendiente'
                      : 'Aprobar y mostrar'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <ShareButton text={fullText} />
        </View>
      ) : null}
    </View>
  );
}

export default function DataBankScreen({ onBack }) {
  const [activeTab, setActiveTab] = useState('Boliches');
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [cityFilter, setCityFilter] = useState('Todas');
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updatingEventId, setUpdatingEventId] = useState(null);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const isMountedRef = useRef(false);
  const currentTime = useCurrentTime();

  const refreshData = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userIsAdmin = isAdminUser(sessionData.session?.user);
      const data = await loadDataBankData(userIsAdmin);
      if (!isMountedRef.current) return;
      setIsAdmin(userIsAdmin);
      setClubs(data.clubs);
      setEvents(data.events);
      setSelectedEventIds([]);
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(getDataBankErrorMessage(error));
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;
    isMountedRef.current = true;

    const loadInitialData = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const userIsAdmin = isAdminUser(sessionData.session?.user);
      if (isActive) setIsAdmin(userIsAdmin);
      return loadDataBankData(userIsAdmin);
    };

    loadInitialData()
      .then((data) => {
        if (!isActive) return;
        setClubs(data.clubs);
        setEvents(data.events);
      })
      .catch((error) => {
        if (isActive) {
          setErrorMessage(getDataBankErrorMessage(error));
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
      isMountedRef.current = false;
    };
  }, []);

  const handleVerificationChange = useCallback(async (eventId, status, sourceUrl) => {
    const source = normalizeVerificationSourceUrl(sourceUrl);
    if (status === 'verified' && !source) {
      Alert.alert(
        'Fuente obligatoria',
        'Pegá un enlace público seguro que empiece con https://.'
      );
      return;
    }

    setUpdatingEventId(eventId);
    try {
      const { data, error } = await supabase
        .from('events')
        .update({
          verification_status: status,
          verification_source_url: source,
        })
        .eq('id', eventId)
        .select('id, verification_status, verification_source_url, verified_at')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('No se confirmó el cambio. Iniciá sesión con la cuenta administradora e intentá de nuevo.');

      setEvents((current) => current.map((event) =>
        event.id === eventId ? { ...event, ...data } : event
      ));
    } catch (error) {
      Alert.alert(
        'No se pudo actualizar la revisión',
        error.message || 'Intentá de nuevo.'
      );
    } finally {
      setUpdatingEventId(null);
    }
  }, []);

  const handleBatchVerification = useCallback(async (selectedEvents) => {
    const eligibleEvents = selectedEvents.filter((event) =>
      isBatchVerifiableEvent(event, currentTime)
    );
    if (eligibleEvents.length !== selectedEvents.length) {
      setSelectedEventIds([]);
      Alert.alert(
        'La selección cambió',
        'Actualizá el Banco de Datos y volvé a seleccionar solo eventos futuros con fuente válida.'
      );
      return;
    }

    const eventIds = eligibleEvents.map((event) => event.id);
    if (!eventIds.length) return;

    setIsBatchUpdating(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .update({ verification_status: 'verified' })
        .in('id', eventIds)
        .select('id, verification_status, verification_source_url, verified_at');

      if (error) throw error;

      const updatedEvents = data || [];
      const updatedById = new Map(updatedEvents.map((event) => [event.id, event]));
      setEvents((current) => current.map((event) =>
        updatedById.has(event.id) ? { ...event, ...updatedById.get(event.id) } : event
      ));
      setSelectedEventIds((current) =>
        current.filter((eventId) => !updatedById.has(eventId))
      );

      if (updatedEvents.length !== eventIds.length) {
        Alert.alert(
          'Revisión incompleta',
          `Se confirmaron ${updatedEvents.length} de ${eventIds.length} eventos. Actualizá la lista para revisar el estado.`
        );
        return;
      }

      Alert.alert('Eventos aprobados', `Se aprobaron ${updatedEvents.length} eventos.`);
    } catch (error) {
      Alert.alert(
        'No se pudo aprobar el lote',
        error.message || 'Intentá de nuevo.'
      );
    } finally {
      setIsBatchUpdating(false);
    }
  }, [currentTime]);

  const upcomingEvents = useMemo(() => filterUpcomingEvents(events, currentTime), [events, currentTime]);
  const ticketEntries = useMemo(
    () => getDataBankTicketEntries(clubs, upcomingEvents),
    [clubs, upcomingEvents]
  );
  const sourceData = activeTab === 'Boliches' ? ticketEntries.clubs : ticketEntries.events;
  const cities = useMemo(
    () => ['Todas', ...new Set(sourceData.map((item) => item.city).filter(Boolean))],
    [sourceData]
  );
  const effectiveCityFilter = cities.includes(cityFilter) ? cityFilter : 'Todas';

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sourceData.filter((item) => {
      const matchCity = effectiveCityFilter === 'Todas' || item.city === effectiveCityFilter;
      if (!query) return matchCity;
      const haystack = [
        item.name || item.title,
        item.city,
        item.neighborhood,
        item.category,
        item.description,
        item.venue,
        item.address,
        item.instagram,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchCity && haystack.includes(query);
    });
  }, [sourceData, search, effectiveCityFilter]);

  const batchEligibleEvents = useMemo(
    () => isAdmin && activeTab === 'Eventos'
      ? filtered.filter((event) => isBatchVerifiableEvent(event, currentTime))
      : [],
    [activeTab, currentTime, filtered, isAdmin]
  );
  const selectedBatchEvents = useMemo(
    () => batchEligibleEvents.filter((event) => selectedEventIds.includes(event.id)),
    [batchEligibleEvents, selectedEventIds]
  );
  const allEligibleEventsSelected = batchEligibleEvents.length > 0 &&
    selectedBatchEvents.length === batchEligibleEvents.length;

  const toggleEventSelection = useCallback((eventId) => {
    setSelectedEventIds((current) => current.includes(eventId)
      ? current.filter((id) => id !== eventId)
      : [...current, eventId]);
  }, []);

  const toggleAllEligibleEvents = useCallback(() => {
    const eligibleIds = batchEligibleEvents.map((event) => event.id);
    setSelectedEventIds((current) => allEligibleEventsSelected
      ? current.filter((id) => !eligibleIds.includes(id))
      : [...new Set([...current, ...eligibleIds])]);
  }, [allEligibleEventsSelected, batchEligibleEvents]);

  const requestBatchVerification = useCallback(() => {
    if (!selectedBatchEvents.length) return;
    Alert.alert(
      `Aprobar ${selectedBatchEvents.length} eventos`,
      'Cada evento tiene fecha futura, datos básicos y una fuente HTTPS. Confirmá que la fuente sea oficial y respalde los datos antes de mostrarlos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar lote',
          onPress: () => handleBatchVerification(selectedBatchEvents),
        },
      ]
    );
  }, [handleBatchVerification, selectedBatchEvents]);

  const renderItem = useCallback(
    ({ item }) => activeTab === 'Boliches'
      ? <ClubCard item={item} />
      : (
        <EventCard
          item={item}
          isAdmin={isAdmin}
          isUpdating={isBatchUpdating || updatingEventId === item.id}
          isSelected={selectedEventIds.includes(item.id)}
          isBatchEligible={isBatchVerifiableEvent(item, currentTime)}
          onToggleSelection={toggleEventSelection}
          onVerificationChange={handleVerificationChange}
        />
      ),
    [
      activeTab,
      currentTime,
      handleVerificationChange,
      isAdmin,
      isBatchUpdating,
      selectedEventIds,
      toggleEventSelection,
      updatingEventId,
    ]
  );

  const renderEmptyState = () => {
    if (loading && !sourceData.length) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#FF5573" />
          <Text style={styles.emptyHint}>Cargando datos actualizados…</Text>
        </View>
      );
    }

    if (errorMessage && !sourceData.length) {
      return (
        <View style={styles.errorState}>
          <Text style={styles.emptyText}>No se pudo cargar el Banco de Datos</Text>
          <Text style={styles.emptyHint}>{errorMessage}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={refreshData}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const hasRecords = sourceData.length > 0;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>✦</Text>
        <Text style={styles.emptyText}>
          {hasRecords
            ? 'No encontramos resultados.'
            : activeTab === 'Eventos'
              ? 'No hay eventos próximos con entradas o precio.'
              : 'No hay boliches con eventos próximos con entradas o precio.'}
        </Text>
        <Text style={styles.emptyHint}>
          {hasRecords
            ? 'Probá otro término o limpiá el buscador.'
            : activeTab === 'Eventos'
              ? 'Cuando haya información de entradas, aparecerá acá.'
              : 'Cuando un boliche tenga un evento con entradas o precio, aparecerá acá.'}
        </Text>
      </View>
    );
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
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <Text style={styles.eyebrow}>HOY SALGO · GUÍA LOCAL</Text>
          <Text style={styles.headerTitle}>Banco de Datos</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Actualizar datos"
          onPress={refreshData}
          style={styles.refreshButton}
          disabled={loading || isBatchUpdating}
        >
          {loading || isBatchUpdating
            ? <ActivityIndicator size="small" color="#FF8195" />
            : <Text style={styles.refreshIcon}>↻</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {['Boliches', 'Eventos'].map((tab) => (
          <TouchableOpacity
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: activeTab === tab }}
            onPress={() => {
              setActiveTab(tab);
              setSearch('');
              setCityFilter('Todas');
              setSelectedEventIds([]);
            }}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'Boliches' ? '♫ Boliches' : '✦ Eventos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
          <View style={styles.searchIcon} accessible={false}>
            <View style={styles.searchIconLens} />
            <View style={styles.searchIconHandle} />
          </View>
          <TextInput
            style={styles.searchInput}
            accessibilityLabel="Buscar por nombre, barrio o categoría"
            placeholder="Nombre, barrio o categoría"
            placeholderTextColor="#748198"
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setSelectedEventIds([]);
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            selectionColor="#FF5573"
          />
          {search.length > 0 ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
              onPress={() => {
                setSearch('');
                setSelectedEventIds([]);
              }}
              style={styles.clearSearchButton}
              hitSlop={8}
            >
              <Text style={styles.clearSearchText}>×</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Text style={styles.filterLabel}>FILTRAR POR CIUDAD</Text>
            <ScrollView
              horizontal
              style={styles.cityScroll}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cityChips}
              keyboardShouldPersistTaps="handled"
            >
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  accessibilityRole="button"
                  accessibilityState={{ selected: effectiveCityFilter === city }}
                  onPress={() => {
                    setSelectedEventIds([]);
                    setCityFilter(city);
                  }}
                  style={[styles.cityChip, effectiveCityFilter === city && styles.cityChipActive]}
                >
                  <Text style={[styles.cityChipText, effectiveCityFilter === city && styles.cityChipTextActive]}>
                    {city}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.counter}>
              <Text style={styles.counterTitle}>RESULTADOS</Text>
              <Text style={styles.counterValue}>
                {filtered.length} {activeTab.toLowerCase()}
                {search ? ` para "${search}"` : ''}
              </Text>
            </View>
            {isAdmin && activeTab === 'Eventos' ? (
              <View style={styles.batchPanel}>
                <Text style={styles.batchTitle}>REVISIÓN EN LOTE</Text>
                <Text style={styles.batchHint}>
                  Solo se incluyen eventos futuros con fuente HTTPS, boliche asociado, ciudad y datos básicos. Confirmá que cada fuente sea oficial.
                </Text>
                <View style={styles.batchActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={!batchEligibleEvents.length || isBatchUpdating}
                    onPress={toggleAllEligibleEvents}
                    style={[
                      styles.batchButton,
                      styles.batchSelectButton,
                      (!batchEligibleEvents.length || isBatchUpdating) && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.batchButtonText}>
                      {allEligibleEventsSelected
                        ? 'Quitar selección'
                        : `Seleccionar aptos (${batchEligibleEvents.length})`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={!selectedBatchEvents.length || isBatchUpdating}
                    onPress={requestBatchVerification}
                    style={[
                      styles.batchButton,
                      styles.batchApproveButton,
                      (!selectedBatchEvents.length || isBatchUpdating) && styles.disabledButton,
                    ]}
                  >
                    {isBatchUpdating ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={styles.batchButtonText}>
                        Aprobar lote ({selectedBatchEvents.length})
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                {!batchEligibleEvents.length ? (
                  <Text style={styles.batchEmptyHint}>
                    No hay eventos elegibles en estos resultados. Completá la fuente y los datos faltantes; los eventos viejos no se pueden aprobar en lote.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshData}
            tintColor="#FF5573"
            colors={['#FF5573']}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151F30',
    borderWidth: 1,
    borderColor: '#29364B',
    borderRadius: 14,
  },
  backText: { color: '#FDA4B3', fontSize: 28, lineHeight: 30, fontWeight: '500' },
  headerTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },
  eyebrow: { color: '#FF8195', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.1,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#151F30',
    borderWidth: 1,
    borderColor: '#29364B',
    borderRadius: 14,
  },
  refreshIcon: { color: '#FF8195', fontSize: 24, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 2,
    marginBottom: 12,
    padding: 4,
    backgroundColor: '#111827',
    borderColor: '#202B40',
    borderWidth: 1,
    borderRadius: 15,
    gap: 6,
  },
  tab: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabActive: { backgroundColor: '#D83E60' },
  tabText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#FFF', fontWeight: '900' },
  searchRow: { paddingHorizontal: 16, paddingTop: 0 },
  searchBox: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111A2A',
    borderColor: '#29364B',
    borderWidth: 1,
    borderRadius: 15,
    paddingLeft: 15,
    paddingRight: 7,
  },
  searchBoxFocused: { borderColor: '#FF718A', backgroundColor: '#141D2E' },
  searchIcon: { width: 20, height: 20, marginRight: 9 },
  searchIconLens: {
    position: 'absolute',
    top: 1,
    left: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#94A3B8',
  },
  searchIconHandle: {
    position: 'absolute',
    right: 1,
    bottom: 3,
    width: 7,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#94A3B8',
    transform: [{ rotate: '45deg' }],
  },
  searchInput: { flex: 1, minHeight: 50, color: '#FFF', fontSize: 14, paddingHorizontal: 0 },
  clearSearchButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#202B40',
  },
  clearSearchText: { color: '#D5DCE8', fontSize: 21, fontWeight: '600', lineHeight: 24 },
  filterLabel: {
    color: '#748198',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 14,
  },
  cityScroll: { flexGrow: 0 },
  cityChips: { alignItems: 'center', paddingTop: 8, paddingBottom: 12, gap: 8 },
  cityChip: {
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: '#151F30',
    borderColor: '#29364B',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  cityChipActive: { backgroundColor: '#2A1D2A', borderColor: '#A93D55' },
  cityChipText: { color: '#A8B4C7', fontSize: 11, fontWeight: '700' },
  cityChipTextActive: { color: '#FFF', fontWeight: '800' },
  counter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: 4,
    marginBottom: 12,
  },
  counterTitle: { color: '#748198', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  counterValue: { color: '#E2E8F0', fontSize: 11, fontWeight: '700', flexShrink: 1 },
  batchPanel: {
    backgroundColor: '#111A2A',
    borderColor: '#36445A',
    borderWidth: 1,
    borderRadius: 15,
    marginBottom: 14,
    padding: 13,
  },
  batchTitle: { color: '#FDA4B3', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  batchHint: { color: '#A8B4C7', fontSize: 11, lineHeight: 16, marginTop: 5 },
  batchActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  batchButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  batchSelectButton: { backgroundColor: '#182235', borderColor: '#3A465A' },
  batchApproveButton: { backgroundColor: '#146B52', borderColor: '#258365' },
  batchButtonText: { color: '#F8FAFC', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  batchEmptyHint: { color: '#F6D68A', fontSize: 10, lineHeight: 15, marginTop: 8 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  card: {
    backgroundColor: '#111A2A',
    borderColor: '#243149',
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  batchSelection: {
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#182235',
    borderBottomWidth: 1,
    borderBottomColor: '#243149',
  },
  batchSelectionActive: { backgroundColor: '#153629' },
  batchSelectionText: { color: '#A8B4C7', fontSize: 11, fontWeight: '700' },
  batchSelectionTextActive: { color: '#86EFAC' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 12 },
  cardIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#241E35',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3A3150',
  },
  cardIconEvent: { backgroundColor: '#172A2A', borderColor: '#2A4544' },
  cardIconEmoji: { fontSize: 22 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { color: '#F8FAFC', fontSize: 15, lineHeight: 20, fontWeight: '800' },
  cardSub: { color: '#A8B4C7', fontSize: 11, marginTop: 3 },
  cardCategory: { color: '#FF9AAB', fontSize: 10, fontWeight: '800', marginTop: 5 },
  verificationBadge: { color: '#FCD34D', fontSize: 10, fontWeight: '800', marginTop: 5 },
  cardChevron: { color: '#7C8AA0', fontSize: 10, marginTop: 2, paddingHorizontal: 2 },
  cardBody: {
    borderTopColor: '#243149',
    borderTopWidth: 1,
    paddingHorizontal: 15,
    paddingBottom: 14,
    paddingTop: 6,
  },
  verificationPanel: {
    backgroundColor: '#171D2A',
    borderColor: '#36445A',
    borderWidth: 1,
    borderRadius: 13,
    marginTop: 12,
    padding: 12,
  },
  verificationTitle: { color: '#FDA4B3', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  verificationHint: { color: '#A8B4C7', fontSize: 12, lineHeight: 18, marginTop: 5 },
  verificationInput: {
    minHeight: 44,
    color: '#F8FAFC',
    fontSize: 12,
    backgroundColor: '#0B1020',
    borderColor: '#3A465A',
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  verificationButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#146B52',
    borderColor: '#258365',
    borderWidth: 1,
    borderRadius: 11,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  pendingButton: { backgroundColor: '#463324', borderColor: '#8C6335' },
  disabledButton: { opacity: 0.55 },
  verificationButtonText: { color: '#F8FAFC', fontSize: 12, fontWeight: '800' },
  fieldRow: { paddingVertical: 8, borderBottomColor: '#202B40', borderBottomWidth: 1 },
  fieldLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: { color: '#E2E8F0', fontSize: 13, marginTop: 2, lineHeight: 18 },
  ticketEventsTitle: { color: '#FDA4B3', fontSize: 10, fontWeight: '800', marginTop: 14 },
  ticketEvent: { paddingVertical: 8, borderBottomColor: '#202B40', borderBottomWidth: 1 },
  ticketEventTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  ticketEventDate: { color: '#A8B4C7', fontSize: 12, marginTop: 3 },
  ticketButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#342038',
    borderColor: '#77415C',
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  ticketButtonText: { color: '#FFD1DB', fontSize: 12, fontWeight: '800' },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
  },
  quickActionBtn: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#142A25',
    borderColor: '#285342',
    borderWidth: 1,
    borderRadius: 12,
  },
  quickActionText: { color: '#86EFAC', fontSize: 12, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 },
  errorState: {
    alignItems: 'center',
    backgroundColor: '#251923',
    borderColor: '#7F3143',
    borderWidth: 1,
    borderRadius: 15,
    marginTop: 20,
    padding: 16,
  },
  emptyIcon: { color: '#FF9AAB', fontSize: 28, marginBottom: 10 },
  emptyText: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', textAlign: 'center' },
  emptyHint: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  retryButton: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: '#FF5573',
  },
  retryButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
});
