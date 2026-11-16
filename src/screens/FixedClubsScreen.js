import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
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
import { supabase } from '../config/supabase';
import { isAdminUser } from '../config/admin';
import { AGE_RANGES, CITIES } from '../constants/eventOptions';
import { getClubLogoSource } from '../constants/clubLogos';
import {
  formatEventDate,
  formatEventDay,
  getEventDateKey,
  getLocalDateKey,
  isEventExpired,
  matchesAgeFilter,
  sortDateKeysByRelevance,
} from '../services/eventDateService';
import { getMapsSearchUrl } from '../services/mapsService';
import { filterClubs } from '../services/clubFilterService';
import useCurrentTime from '../hooks/useCurrentTime';
import { getClubLogoStoragePath } from '../services/clubLogoService';
import {
  fetchFavoriteKeys,
  getFavoriteErrorMessage,
  getFavoriteKey,
} from '../services/favoriteService';
import FavoriteButton from '../components/FavoriteButton';
import ClubWhatsAppButton from '../components/ClubWhatsAppButton';
import PromotionWhatsAppButton from '../components/PromotionWhatsAppButton';
import TicketSalesInquiryButton from '../components/TicketSalesInquiryButton';
import EventPageButton from '../components/EventPageButton';
import ClubFlyer from '../components/ClubFlyer';
import InstagramButton from '../components/InstagramButton';
import DateRangeFilter from '../components/DateRangeFilter';
import { recordContentView, recordTicketClick } from '../services/analyticsService';
import { getAvailableFilterOptions, matchesFilterValue } from '../services/filterOptionsService';
import { fetchAllPages } from '../services/paginationService';
import { normalizeTicketUrl, openTrackedTicketUrl } from '../services/ticketUrlService';
import { normalizeVerificationSourceUrl } from '../services/eventVerificationService';

const AGE_FILTERS = ['Todas', ...AGE_RANGES];
const ALL_DATES = 'Todas las fechas';

const getLoadErrorMessage = (error) => {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return 'Falta crear la tabla de boliches en Supabase. Ejecutá la migración supabase/migrations/20261103000000_create_clubs.sql.';
  }
  if (['42703', 'PGRST204'].includes(error?.code)) {
    return 'Falta aplicar la migración supabase/migrations/20261106000000_link_events_to_clubs.sql en Supabase para relacionar eventos y boliches.';
  }
  return error?.message || 'No pudimos cargar los boliches.';
};

const fetchClubs = async (showPending) => {
  const [savedClubs, savedEvents] = await Promise.all([
    fetchAllPages((from, to) => supabase
      .from('clubs')
      .select('id, name, city, neighborhood, address, phone, logo_url, instagram_url, verification_status, verification_source_url')
      .eq('verification_status', showPending ? 'pending' : 'verified')
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)),
    fetchAllPages((from, to) => supabase
      .from('events')
      .select('id, club_id, title, venue_name, city, description, event_date, event_end_date, age_range, image_url, ticket_url, ticket_sales_enabled')
      .not('club_id', 'is', null)
      .eq('verification_status', 'verified')
      .order('event_date', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, to)),
  ]);

  const clubsById = new Map();
  for (const savedClub of savedClubs) {
    const name = savedClub.name?.trim();
    if (!name) continue;

    clubsById.set(savedClub.id, {
      id: `club:${savedClub.id}`,
      databaseId: savedClub.id,
      name,
      city: savedClub.city?.trim() || '',
      neighborhood: savedClub.neighborhood?.trim() || '',
      address: savedClub.address?.trim() || '',
      phone: savedClub.phone?.trim() || '',
      logoUrl: savedClub.logo_url?.trim() || '',
      instagramUrl: savedClub.instagram_url?.trim() || '',
      verificationStatus: savedClub.verification_status,
      verificationSourceUrl: savedClub.verification_source_url,
      events: [],
    });
  }

  for (const event of savedEvents) {
    const club = clubsById.get(event.club_id);
    if (!club) continue;

    club.events.push({
      id: event.id,
      title: event.title?.trim() || 'Evento',
      venue: event.venue_name?.trim() || club.name,
      city: event.city?.trim() || club.city,
      description: event.description,
      eventDate: event.event_date,
      eventEndDate: event.event_end_date,
      dateKey: getEventDateKey(event.event_date),
      ageRange: event.age_range,
      imageUrl: event.image_url?.trim() || '',
      ticketUrl: event.ticket_url,
      ticketSalesEnabled: event.ticket_sales_enabled,
    });
  }

  return [...clubsById.values()].sort((first, second) =>
    first.name.localeCompare(second.name)
  );
};

function ClubEventCard({ event }) {
  const [imageError, setImageError] = useState(false);
  const ticketUrl = normalizeTicketUrl(event.ticketUrl);

  const openTickets = async () => {
    try {
      await openTrackedTicketUrl(ticketUrl, event.id, (url) => Linking.openURL(url), recordTicketClick);
    } catch (error) {
      Alert.alert('No se pudo abrir la ticketera', error.message || 'Revisá tu conexión e intentá de nuevo.');
    }
  };

  return (
    <View style={styles.clubEventCard}>
      {event.imageUrl && !imageError ? (
        <Image
          source={{ uri: event.imageUrl }}
          style={styles.eventFlyer}
          resizeMode="contain"
          accessibilityLabel={`Flyer de ${event.title}`}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={styles.eventFlyerPlaceholder}>
          <Text style={styles.eventFlyerPlaceholderIcon}>✦</Text>
          <Text style={styles.eventFlyerPlaceholderText}>FLYER NO DISPONIBLE</Text>
        </View>
      )}
      <EventPageButton ticketUrl={event.ticketUrl} title={event.title} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventRowDate}>{formatEventDate(event.eventDate)}</Text>
        <Text style={styles.eventRowTitle}>{event.title}</Text>
        {event.ageRange ? <Text style={styles.eventRowAge}>{event.ageRange}</Text> : null}
        {ticketUrl ? (
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel={`Ver entradas para ${event.title}`}
            onPress={openTickets}
            style={styles.ticketButton}
          >
            <Text style={styles.ticketButtonText}>🎟  Ver entradas y precios</Text>
          </TouchableOpacity>
        ) : null}
        <TicketSalesInquiryButton event={{
          title: event.title,
          date: event.eventDate,
          venue: event.venue,
          city: event.city,
          description: event.description,
          ticketUrl: event.ticketUrl,
          ticketSalesEnabled: event.ticketSalesEnabled,
        }} />
      </View>
    </View>
  );
}

function ClubReviewPanel({ club, isUpdating, onChange }) {
  const [sourceUrl, setSourceUrl] = useState(club.verificationSourceUrl || '');
  const verified = club.verificationStatus === 'verified';
  return (
    <View style={styles.reviewPanel}>
      <Text style={styles.reviewTitle}>{verified ? 'Boliche verificado' : 'Pendiente de revisión'}</Text>
      <Text style={styles.reviewHint}>
        {verified
          ? `Fuente: ${club.verificationSourceUrl}`
          : 'Comprobá el nombre, ubicación y datos visibles antes de aprobar. Pegá una fuente pública confiable.'}
      </Text>
      {!verified ? (
        <TextInput
          accessibilityLabel={`Fuente de ${club.name}`}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isUpdating}
          keyboardType="url"
          onChangeText={setSourceUrl}
          placeholder="https://fuente-oficial-o-ticketera..."
          placeholderTextColor="#748198"
          style={styles.reviewInput}
          value={sourceUrl}
        />
      ) : null}
      <TouchableOpacity
        accessibilityRole="button"
        disabled={isUpdating}
        onPress={() => onChange(club.databaseId, verified ? 'pending' : 'verified', sourceUrl)}
        style={styles.reviewButton}
      >
        <Text style={styles.reviewButtonText}>
          {isUpdating ? 'Guardando…' : verified ? 'Ocultar y dejar pendiente' : 'Aprobar y mostrar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FixedClubsScreen({
  isAdmin,
  userId,
  onBack,
  onAddClub,
  onEditClub,
  onSignIn,
  onShowFavorites,
  onShowDataBank,
}) {
  const [clubs, setClubs] = useState([]);
  const [favoriteKeys, setFavoriteKeys] = useState(new Set());
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedClubId, setSelectedClubId] = useState('Todos');
  const [selectedAge, setSelectedAge] = useState('Todas');
  const [onlyWithEvents, setOnlyWithEvents] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [selectedDate, setSelectedDate] = useState(ALL_DATES);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingClubId, setDeletingClubId] = useState(null);
  const [updatingClubId, setUpdatingClubId] = useState(null);
  const [expandedClubId, setExpandedClubId] = useState(null);
  const seenClubViews = useRef(new Set());
  const currentTime = useCurrentTime();
  const showReview = isAdmin && showPending;
  const hasDateRange = Boolean(dateRange.from || dateRange.to);
  const cityFilters = useMemo(
    () => getAvailableFilterOptions(CITIES, clubs.map((club) => club.city)),
    [clubs]
  );
  const activeSelectedCity = cityFilters.some((city) => matchesFilterValue(city, selectedCity))
    ? selectedCity
    : 'Todas';
  const activeSelectedClubId = selectedClubId === 'Todos' || clubs.some(
    (club) => club.databaseId === selectedClubId &&
      (activeSelectedCity === 'Todas' || matchesFilterValue(club.city, activeSelectedCity))
  ) ? selectedClubId : 'Todos';

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      Promise.resolve().then(() => {
        if (isMounted) setFavoriteKeys(new Set());
      });
      return () => {
        isMounted = false;
      };
    }

    Promise.resolve()
      .then(() => fetchFavoriteKeys(userId))
      .then((keys) => {
        if (isMounted) setFavoriteKeys(new Set(keys));
      })
      .catch((error) => {
        if (isMounted) {
          Alert.alert('No se pudieron cargar favoritos', getFavoriteErrorMessage(error));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const updateFavorite = (itemId, isFavorite) => {
    const key = getFavoriteKey('club', itemId);
    setFavoriteKeys((current) => {
      const next = new Set(current);
      if (isFavorite) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const activeSelectedDate = hasDateRange
    ? ALL_DATES
    : selectedDate === ALL_DATES ||
        clubs.some(
          (club) =>
            club.databaseId === activeSelectedClubId &&
            club.events.some(
              (event) =>
                event.dateKey === selectedDate &&
                !isEventExpired(event.eventDate, currentTime, event.eventEndDate) &&
                matchesAgeFilter(event.ageRange, selectedAge)
            )
        )
      ? selectedDate
      : ALL_DATES;

  const resetDateFilter = () => {
    setSelectedDate(ALL_DATES);
    setDateRange({ from: '', to: '' });
  };

  const loadClubs = useCallback(async () => {
    try {
      const nextClubs = await fetchClubs(showReview);
      setClubs(nextClubs);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getLoadErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [showReview]);

  useEffect(() => {
    let isMounted = true;

    fetchClubs(showReview)
      .then((nextClubs) => {
        if (isMounted) {
          setClubs(nextClubs);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getLoadErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showReview]);

  const handleClubVerification = async (clubId, status, sourceUrl) => {
    const source = status === 'verified' ? normalizeVerificationSourceUrl(sourceUrl) : null;
    if (status === 'verified' && !source) {
      Alert.alert('Fuente obligatoria', 'Pegá un enlace público seguro que empiece con https://.');
      return;
    }

    setUpdatingClubId(clubId);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .update({ verification_status: status, verification_source_url: source })
        .eq('id', clubId)
        .select('id, verification_status')
        .maybeSingle();
      if (error) throw error;
      if (!data || data.verification_status !== status) {
        throw new Error('No se confirmó el cambio. Iniciá sesión como administrador e intentá de nuevo.');
      }
      await loadClubs();
    } catch (error) {
      Alert.alert('No se pudo actualizar la revisión', error.message || 'Intentá de nuevo.');
    } finally {
      setUpdatingClubId(null);
    }
  };

  const filteredClubs = useMemo(() => filterClubs(clubs, {
    selectedCity: activeSelectedCity,
    selectedClubId: activeSelectedClubId,
    selectedAge,
    activeSelectedDate,
    allDates: ALL_DATES,
    dateRange,
    hasDateRange,
    currentTime,
    onlyWithEvents,
  }), [
    clubs,
    activeSelectedCity,
    activeSelectedClubId,
    selectedAge,
    activeSelectedDate,
    currentTime,
    dateRange,
    hasDateRange,
    onlyWithEvents,
  ]);
  const availableDates = useMemo(() => {
    if (activeSelectedClubId === 'Todos') return [];
    const selectedClub = clubs.find(
      (club) => club.databaseId === activeSelectedClubId
    );
    if (!selectedClub) return [];

    return sortDateKeysByRelevance(
      [...new Set(
        selectedClub.events
          .filter((event) => !isEventExpired(event.eventDate, currentTime, event.eventEndDate))
          .filter((event) => matchesAgeFilter(event.ageRange, selectedAge))
          .map((event) => event.dateKey)
          .filter(Boolean)
      )]
    );
  }, [clubs, activeSelectedClubId, selectedAge, currentTime]);

  const clubsInCity = useMemo(
    () =>
      activeSelectedCity === 'Todas'
        ? clubs
        : clubs.filter((club) => matchesFilterValue(club.city, activeSelectedCity)),
    [clubs, activeSelectedCity]
  );
  const selectedClub = clubsInCity.find(
    (club) => club.databaseId === activeSelectedClubId
  );
  const todayKey = getLocalDateKey();

  const deleteClub = async (club) => {
    setDeletingClubId(club.databaseId);
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!isAdminUser(sessionData?.session?.user)) {
        throw new Error('Iniciá sesión con la cuenta administradora para eliminar boliches.');
      }

      const { data, error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', club.databaseId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data?.id) {
        throw new Error('Supabase no confirmó la eliminación. Revisá la política SQL de boliches.');
      }

      let cleanupWarning = '';
      const logoPath = getClubLogoStoragePath(club.logoUrl);
      if (logoPath) {
        const { error: cleanupError } = await supabase.storage
          .from('event-images')
          .remove([logoPath]);
        if (cleanupError) {
          console.error('No se pudo limpiar el logo del boliche eliminado:', cleanupError);
          cleanupWarning = ' No se pudo borrar su imagen de Storage.';
        }
      }

      await loadClubs();
      Alert.alert('Boliche eliminado', `Se eliminó ${club.name}.${cleanupWarning}`);
    } catch (error) {
      Alert.alert('No se pudo eliminar el boliche', error.message || 'Revisá la conexión e intentá de nuevo.');
    } finally {
      setDeletingClubId(null);
    }
  };

  const confirmDeleteClub = (club) => {
    Alert.alert(
      'Eliminar boliche',
      `¿Querés eliminar ${club.name}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteClub(club),
        },
      ]
    );
  };

  const renderClub = ({ item }) => {
    const isExpanded = expandedClubId === item.databaseId;

    const toggleExpanded = () => {
      const nextExpanded = !isExpanded;
      setExpandedClubId(nextExpanded ? item.databaseId : null);
      if (!showReview && nextExpanded && item.databaseId && !seenClubViews.current.has(item.databaseId)) {
        seenClubViews.current.add(item.databaseId);
        recordContentView('club', item.databaseId);
      }
    };

    const openLocation = async () => {
      const mapsUrl = getMapsSearchUrl({
        name: item.name,
        address: item.address,
        neighborhood: item.neighborhood,
        city: item.city,
      });
      if (!mapsUrl) return;

      try {
        await Linking.openURL(mapsUrl);
      } catch (error) {
        Alert.alert(
          'No se pudo abrir el mapa',
          error.message || 'Revisá tu conexión e intentá de nuevo.'
        );
      }
    };

    return (
      <View style={[styles.clubCard, isExpanded && styles.clubCardExpanded]}>
        <ClubFlyer name={item.name} city={item.city} />
        <View style={styles.clubHeader}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleExpanded}
            accessibilityRole="button"
            accessibilityState={{ expanded: isExpanded }}
            accessibilityLabel={`${item.name} — ${isExpanded ? 'ocultar' : 'ver'} todos los próximos eventos`}
            style={styles.clubHeaderMain}
          >
            {getClubLogoSource(item.databaseId, item.logoUrl) ? (
              <Image
                source={getClubLogoSource(item.databaseId, item.logoUrl)}
                style={styles.clubLogo}
                resizeMode="contain"
                accessibilityLabel={`Logo de ${item.name}`}
              />
            ) : (
              <View style={styles.clubIcon}>
                <Text style={styles.clubIconText}>♫</Text>
              </View>
            )}
            <View style={styles.clubDetails}>
              <Text numberOfLines={2} style={styles.clubName}>{item.name}</Text>
              {[item.neighborhood, item.city].filter(Boolean).length ? (
                <Text numberOfLines={1} style={styles.location}>
                  {[item.neighborhood, item.city].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
              <Text style={styles.eventCount}>
                {item.visibleEvents.length
                  ? `${item.visibleEvents.length} ${
                      item.visibleEvents.length === 1 ? 'evento próximo' : 'eventos próximos'
                    }`
                  : 'Sin eventos próximos'}
              </Text>
            </View>
          </TouchableOpacity>
          {!showReview ? <FavoriteButton
            userId={userId}
            itemType="club"
            itemId={item.databaseId || item.id}
            itemData={{
              name: item.name,
              city: item.city,
              neighborhood: item.neighborhood,
              logo_url: item.logoUrl,
            }}
            isFavorite={favoriteKeys.has(
              getFavoriteKey('club', item.databaseId || item.id)
            )}
            onFavoriteChange={(isFavorite) =>
              updateFavorite(item.databaseId || item.id, isFavorite)
            }
            onSignIn={onSignIn}
          /> : null}
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded: isExpanded }}
          onPress={toggleExpanded}
          style={styles.expandButton}
        >
          <Text style={styles.expandArrow}>
            {isExpanded ? 'Ocultar eventos' : 'Ver eventos del boliche'}
          </Text>
          <Text style={styles.expandArrowIcon}>{isExpanded ? '⌃' : '⌄'}</Text>
        </TouchableOpacity>

        {isExpanded && item.visibleEvents.length ? (
          <View style={styles.eventsExpanded}>
            <Text style={styles.eventsExpandedTitle}>PRÓXIMOS EVENTOS</Text>
            {item.visibleEvents.map((event) => (
              <ClubEventCard key={`${event.id}-${event.imageUrl}`} event={event} />
            ))}
          </View>
        ) : isExpanded ? (
          <View style={styles.eventsExpanded}>
            <Text style={styles.eventsExpandedTitle}>PRÓXIMOS EVENTOS</Text>
            <Text style={styles.noEventsText}>
              No hay eventos próximos para este boliche con los filtros seleccionados.
            </Text>
          </View>
        ) : null}

        {item.address ? (
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel={`Ver ubicación de ${item.name} en el mapa`}
            onPress={openLocation}
            style={styles.mapButton}
          >
            <Text style={styles.mapButtonText}>⌖  Cómo llegar</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.clubContactActions}>
          <ClubWhatsAppButton clubName={item.name} phone={item.phone} />
          <InstagramButton value={item.instagramUrl} label={item.name} />
        </View>
        {isAdmin && isExpanded ? (
          <ClubReviewPanel
            club={item}
            isUpdating={updatingClubId === item.databaseId}
            onChange={handleClubVerification}
          />
        ) : null}
        {isAdmin && item.databaseId ? (
          <View style={styles.clubAdminActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Modificar ${item.name}`}
              disabled={deletingClubId === item.databaseId}
              onPress={() =>
                onEditClub?.({
                  id: item.databaseId,
                  name: item.name,
                  city: item.city,
                  neighborhood: item.neighborhood,
                  address: item.address,
                  phone: item.phone,
                  logoUrl: item.logoUrl,
                  instagramUrl: item.instagramUrl,
                })
              }
              style={styles.editClubButton}
            >
              <Text style={styles.editClubButtonText}>Modificar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Eliminar ${item.name}`}
              disabled={deletingClubId === item.databaseId}
              onPress={() => confirmDeleteClub(item)}
              style={styles.deleteClubButton}
            >
              {deletingClubId === item.databaseId ? (
                <ActivityIndicator size="small" color="#FDA4AF" />
              ) : (
                <Text style={styles.deleteClubButtonText}>Eliminar</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#FF5573" />
          <Text style={styles.stateMessage}>Cargando boliches…</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>No pudimos cargar los boliches</Text>
          <Text style={styles.stateMessage}>{errorMessage}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => {
              setLoading(true);
              loadClubs();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Text style={styles.emptyIcon}>♫</Text>
        <Text style={styles.stateTitle}>
          {clubs.length
            ? onlyWithEvents || ((hasDateRange || activeSelectedDate !== ALL_DATES || selectedAge !== 'Todas') &&
              activeSelectedClubId !== 'Todos')
              ? 'No hay eventos para estos filtros'
              : 'No hay boliches en esta ciudad'
            : 'Todavía no hay boliches'}
        </Text>
        <Text style={styles.stateMessage}>
          {clubs.length
            ? onlyWithEvents || ((hasDateRange || activeSelectedDate !== ALL_DATES || selectedAge !== 'Todas') &&
              activeSelectedClubId !== 'Todos')
              ? 'Probá cambiar la ciudad, la fecha o la edad, o mostrar todos los boliches.'
              : 'Probá con otra ciudad para ver los lugares disponibles.'
            : 'Acá aparecen los boliches permanentes. Las fiestas eventuales se muestran en Eventos.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={errorMessage ? [] : filteredClubs}
        keyExtractor={(item) => item.id}
        renderItem={renderClub}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Volver a los eventos"
                onPress={onBack}
                style={styles.backButton}
              >
                <Text style={styles.backText}>‹  Eventos</Text>
              </TouchableOpacity>
              <Text style={styles.brand}>HOY SALGO</Text>
            </View>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>LUGARES PARA SALIR</Text>
              <Text style={styles.title}>Boliches</Text>
              <Text style={styles.subtitle}>
                Encontrá boliches permanentes y filtrá fechas puntuales o por rango.
              </Text>
              {isAdmin ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ selected: showReview }}
                  disabled={loading || updatingClubId !== null}
                  onPress={() => {
                    setClubs([]);
                    setLoading(true);
                    setErrorMessage('');
                    setShowPending(!showReview);
                    setSelectedCity('Todas');
                    setSelectedClubId('Todos');
                    setOnlyWithEvents(false);
                    setSelectedAge('Todas');
                    resetDateFilter();
                  }}
                  style={[styles.chip, showReview && styles.chipActive]}
                >
                  <Text style={[styles.chipText, showReview && styles.chipTextActive]}>
                    {showReview ? 'Viendo pendientes · Volver a verificados' : 'Revisar boliches pendientes'}
                  </Text>
                </TouchableOpacity>
              ) : null}
                            <View style={styles.heroActions}>
                {userId ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Ver mis boliches y eventos favoritos"
                    onPress={onShowFavorites}
                    style={styles.favoritesButton}
                  >
                    <Text style={styles.favoritesButtonText}>♥  Mis favoritos</Text>
                  </TouchableOpacity>
                ) : null}
                {onShowDataBank ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Banco de datos"
                    onPress={onShowDataBank}
                    style={styles.dataBankButton}
                  >
                    <Text style={styles.dataBankButtonText}>◈  Banco de datos</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            <PromotionWhatsAppButton />
            <Text style={styles.filterTitle}>Mostrar boliches</Text>
            <View style={styles.eventFilterRow}>
              {[
                { label: 'Todos', value: false },
                { label: 'Con eventos próximos', value: true },
              ].map((option) => (
                <TouchableOpacity
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: onlyWithEvents === option.value }}
                  onPress={() => setOnlyWithEvents(option.value)}
                  style={[styles.chip, onlyWithEvents === option.value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, onlyWithEvents === option.value && styles.chipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.filterTitle}>Filtrar por ciudad</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {cityFilters.map((city) => {
                const isSelected = activeSelectedCity === city;
                return (
                  <TouchableOpacity
                    key={city}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setSelectedCity(city);
                      setSelectedClubId('Todos');
                      setSelectedAge('Todas');
                      resetDateFilter();
                    }}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {city}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <Text style={styles.filterTitle}>Elegí un boliche</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {[
                { id: 'Todos', name: 'Todos los boliches' },
                ...clubsInCity.map((club) => ({
                  id: club.databaseId,
                  name: club.name,
                })),
              ].map((clubOption) => {
                const isSelected = activeSelectedClubId === clubOption.id;
                return (
                  <TouchableOpacity
                    key={clubOption.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setSelectedClubId(clubOption.id);
                      setSelectedAge('Todas');
                      resetDateFilter();
                    }}
                    style={[styles.chip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {clubOption.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {activeSelectedClubId !== 'Todos' ? (
              <>
                <Text style={styles.filterTitle}>Filtrar por edad</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {AGE_FILTERS.map((age) => {
                    const isSelected = selectedAge === age;
                    return (
                      <TouchableOpacity
                        key={age}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => {
                          setSelectedAge(age);
                          resetDateFilter();
                        }}
                        style={[styles.chip, isSelected && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {age === 'Todas' ? 'Cualquier edad' : age}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Text style={styles.filterTitle}>
                  Fechas de {selectedClub?.name || 'este boliche'}
                </Text>
                <DateRangeFilter
                  fromDate={dateRange.from}
                  toDate={dateRange.to}
                  onChange={(from, to) => {
                    setSelectedDate(ALL_DATES);
                    setDateRange({ from, to });
                  }}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                >
                  {[
                    ALL_DATES,
                    ...availableDates,
                  ].map((dateKey) => {
                    const isAllDates = dateKey === ALL_DATES;
                    const isSelected = !hasDateRange && activeSelectedDate === dateKey;
                    return (
                      <TouchableOpacity
                        key={dateKey}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected && !hasDateRange }}
                        onPress={() => {
                          setDateRange({ from: '', to: '' });
                          setSelectedDate(dateKey);
                        }}
                        style={[styles.chip, isSelected && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {isAllDates
                            ? ALL_DATES
                            : dateKey === todayKey
                              ? 'Hoy'
                              : formatEventDay(dateKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {availableDates.length === 0 ? (
                  <Text style={styles.noDatesHint}>
                    No hay eventos asociados para estos filtros. Revisá la edad o vinculá un evento a este boliche al publicarlo.
                  </Text>
                ) : null}
              </>
            ) : null}
            <Text style={styles.listHeading}>
              {activeSelectedClubId === 'Todos'
                ? `${filteredClubs.length} ${filteredClubs.length === 1 ? 'lugar' : 'lugares'}`
                : `${filteredClubs.reduce(
                    (total, club) => total + club.visibleEvents.length,
                    0
                  )} eventos de ${selectedClub?.name || 'este boliche'}${
                    hasDateRange
                      ? ` · ${
                          dateRange.from && dateRange.to
                            ? `${formatEventDay(dateRange.from)} – ${formatEventDay(dateRange.to)}`
                            : dateRange.from
                              ? `Desde ${formatEventDay(dateRange.from)}`
                              : `Hasta ${formatEventDay(dateRange.to)}`
                        }`
                      : activeSelectedDate !== ALL_DATES
                        ? ` · ${formatEventDay(activeSelectedDate)}`
                        : ''
                  }`}
            </Text>
          </View>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setLoading(true);
              loadClubs();
            }}
            tintColor="#FF5573"
            colors={['#FF5573']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      {isAdmin && onAddClub ? (
        <View style={styles.adminActionBar}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión y agregar boliche"
            onPress={onAddClub}
            style={styles.addClubButton}
          >
            <Text style={styles.addClubButtonText}>＋  Agregar boliche</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020' },
  listContainer: { flexGrow: 1, paddingHorizontal: 18, paddingBottom: 28 },
  header: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { minHeight: 44, justifyContent: 'center', paddingRight: 12 },
  backText: { color: '#FDA4B3', fontSize: 14, fontWeight: '700' },
  brand: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  hero: {
    backgroundColor: '#211B37',
    borderColor: '#342849',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginTop: 10,
    marginBottom: 22,
  },
  eyebrow: { color: '#FF9AAB', fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  title: { color: '#FFF', fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#C4BBD1', fontSize: 13, lineHeight: 19, marginTop: 5 },
    heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  favoritesButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#30213C',
    borderColor: '#49304E',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  favoritesButtonText: { color: '#FF9AAB', fontSize: 12, fontWeight: '800' },
  dataBankButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2D3F',
    borderColor: '#2A5068',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  dataBankButtonText: { color: '#7DD3FC', fontSize: 12, fontWeight: '800' },
  filterTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 9,
    textTransform: 'uppercase',
  },
  noDatesHint: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -12,
    marginBottom: 16,
  },
  chipRow: { gap: 8, paddingBottom: 22 },
  eventFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 22 },
  chip: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C2639',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 13,
  },
  chipActive: { backgroundColor: '#FF5573', borderColor: '#FF5573' },
  chipText: { color: '#CFD6E4', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#FFF', fontWeight: '800' },
  listHeading: { color: '#F8FAFC', fontSize: 19, fontWeight: '900', marginBottom: 13 },
  clubCard: {
    backgroundColor: '#111A2A',
    borderColor: '#243149',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  clubHeader: { flexDirection: 'row', alignItems: 'center' },
  clubHeaderMain: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0 },
  clubIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#261D31',
    borderRadius: 17,
    marginRight: 14,
  },
  clubLogo: {
    width: 58,
    height: 58,
    borderRadius: 17,
    marginRight: 14,
    backgroundColor: '#261D31',
  },
  clubIconText: { color: '#FF9AAB', fontSize: 23, fontWeight: '800' },
  clubDetails: { flex: 1, minWidth: 0, paddingVertical: 2 },
  clubName: { color: '#F8FAFC', fontSize: 16, lineHeight: 21, fontWeight: '800' },
  location: { color: '#A8B4C7', fontSize: 12, marginTop: 4 },
  clubContactActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  reviewPanel: { marginTop: 14, gap: 8 },
  reviewTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '800' },
  reviewHint: { color: '#A8B4C7', fontSize: 12, lineHeight: 18 },
  reviewInput: {
    color: '#FFF', backgroundColor: '#1C2639', borderColor: '#2A3850',
    borderWidth: 1, borderRadius: 12, minHeight: 44, paddingHorizontal: 12,
  },
  reviewButton: {
    minHeight: 40, alignSelf: 'flex-start', justifyContent: 'center',
    backgroundColor: '#30213C', borderRadius: 12, paddingHorizontal: 14,
  },
  reviewButtonText: { color: '#FF9AAB', fontSize: 12, fontWeight: '800' },
  mapButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    justifyContent: 'center',
    backgroundColor: '#18263A',
    borderColor: '#2B405A',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  mapButtonText: { color: '#9ADCF4', fontSize: 12, fontWeight: '800' },
  clubAdminActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editClubButton: {
    minHeight: 36,
    justifyContent: 'center',
    backgroundColor: '#1C2639',
    borderColor: '#49304E',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  editClubButtonText: { color: '#E9D5FF', fontSize: 11, fontWeight: '800' },
  deleteClubButton: {
    minWidth: 78,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3A1D2A',
    borderColor: '#713044',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  deleteClubButtonText: { color: '#FDA4AF', fontSize: 11, fontWeight: '800' },
  addClubButton: {
    width: '100%',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5573',
    borderRadius: 14,
  },
  addClubButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  adminActionBar: {
    backgroundColor: '#111827',
    borderTopColor: '#263247',
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  eventCount: { color: '#FF9AAB', fontSize: 11, fontWeight: '700', marginTop: 6 },
  clubCardExpanded: {
    borderColor: '#744052',
    backgroundColor: '#171F33',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
    borderTopWidth: 1,
    borderTopColor: '#243149',
    marginTop: 12,
    paddingTop: 8,
  },
  expandArrow: {
    color: '#FF9AAB',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  expandArrowIcon: { color: '#FF9AAB', fontSize: 18, fontWeight: '700' },
  eventsExpanded: {
    marginTop: 16,
    backgroundColor: '#0D1523',
    borderRadius: 15,
    borderColor: '#26354B',
    borderWidth: 1,
    padding: 12,
  },
  eventsExpandedTitle: {
    color: '#A8B4C7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginVertical: 8,
    textTransform: 'uppercase',
  },
  noEventsText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 8,
  },
  clubEventCard: {
    backgroundColor: '#151F30',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  eventFlyer: { width: '100%', height: 190, backgroundColor: '#090D16' },
  eventFlyerPlaceholder: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#172238',
    padding: 16,
  },
  eventFlyerPlaceholderIcon: { color: '#FF9AAB', fontSize: 24 },
  eventFlyerPlaceholderText: {
    color: '#A8B4C7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 6,
  },
  eventInfo: { padding: 12 },
  eventRowDate: { color: '#FF9AAB', fontSize: 11, fontWeight: '800' },
  eventRowTitle: { color: '#F8FAFC', fontSize: 15, lineHeight: 20, fontWeight: '800', marginTop: 5 },
  eventRowAge: { color: '#A8B4C7', fontSize: 11, marginTop: 4 },
  ticketButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    backgroundColor: '#D83C60',
    borderRadius: 12,
  },
  ticketButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#131A2B',
    borderColor: '#202B40',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
  emptyIcon: { color: '#FF9AAB', fontSize: 28, marginBottom: 6 },
  stateTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateMessage: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 12,
    backgroundColor: '#FF5573',
    borderRadius: 14,
  },
  retryText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
