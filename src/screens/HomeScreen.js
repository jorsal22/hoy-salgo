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
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventFlyerViewer from '../components/EventFlyerViewer';
import { getClubLogoSource } from '../constants/clubLogos';
import { supabase } from '../config/supabase';
import { AGE_RANGES, CATEGORIES, CITIES } from '../constants/eventOptions';
import {
  formatEventDate,
  formatEventDay,
  getAgeMinimum,
  getEventDateKey,
  getLocalDateKey,
  isEventExpired,
  matchesAgeFilter,
  sortDateKeysByRelevance,
  sortEventsForDisplay,
} from '../services/eventDateService';
import useCurrentTime from '../hooks/useCurrentTime';
import { getMapsSearchUrl } from '../services/mapsService';
import {
  fetchFavoriteKeys,
  getFavoriteErrorMessage,
  getFavoriteKey,
} from '../services/favoriteService';
import FavoriteButton from '../components/FavoriteButton';
import PromotionWhatsAppButton from '../components/PromotionWhatsAppButton';
import InstagramButton from '../components/InstagramButton';
import MyTicketsModal from '../components/MyTicketsModal';
import TicketPurchaseModal from '../components/TicketPurchaseModal';
import TicketSalesInquiryButton from '../components/TicketSalesInquiryButton';
import EventPageButton from '../components/EventPageButton';
import DateRangeFilter from '../components/DateRangeFilter';
import { recordContentView, recordTicketClick } from '../services/analyticsService';
import { getTicketShareLine, normalizeTicketUrl, openTrackedTicketUrl } from '../services/ticketUrlService';
import { getAvailableFilterOptions, getEventCategoryOptions, matchesFilterValue } from '../services/filterOptionsService';
import { fetchAllPages } from '../services/paginationService';
import { filterVerifiedEvents } from '../services/eventVerificationService';

const AGE_FILTERS = ['Todas', ...AGE_RANGES];
const ALL_DATES = 'Todas las fechas';
const EVENTS_REQUEST_TIMEOUT_MS = 12000;
const EVENT_VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };
const INTERNAL_TICKET_SALES_ENABLED = false;

const fetchEvents = async (isAdmin) => {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, EVENTS_REQUEST_TIMEOUT_MS);

  try {
    const data = await fetchAllPages((from, to) => {
      let query = supabase
        .from('events')
        .select('*, clubs(id, address, logo_url)');
      if (!isAdmin) query = query.eq('verification_status', 'verified');
      return query
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, to)
        .abortSignal(controller.signal);
    });

    if (timedOut) {
      throw new Error('La conexión tardó demasiado. Revisá internet e intentá de nuevo.');
    }
    return isAdmin ? data : filterVerifiedEvents(data);
  } catch (error) {
    if (timedOut) {
      throw new Error('La conexión tardó demasiado. Revisá internet e intentá de nuevo.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

function EventFlyer({ uri, title, eventDate, venue, city, logo, onPress }) {
  const [failedUri, setFailedUri] = useState(null);

  if (!uri || uri === failedUri) {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(eventDate || '')
      ? formatEventDay(eventDate)
      : formatEventDate(eventDate);
    const year = getEventDateKey(eventDate).slice(0, 4);

    return (
      <View
        style={styles.flyerPlaceholder}
        accessible
        accessibilityLabel={`Diseño de Hoy Salgo: ${title || 'Evento'}, ${date}${year ? `, ${year}` : ''}${venue ? `, ${venue}` : ''}${city ? `, ${city}` : ''}`}
      >
        <View style={styles.flyerAccentCircle} />
        <View style={styles.flyerTopRow}>
          <Text style={styles.flyerBrand}>HOY SALGO</Text>
          {logo ? <Image source={logo} style={styles.flyerLogo} contentFit="cover" /> : null}
        </View>
        <View style={styles.flyerTextContent}>
          <Text style={styles.flyerPlaceholderText} numberOfLines={3}>{title || 'Evento'}</Text>
          <Text style={styles.flyerDate} numberOfLines={1}>
            {date}{year ? ` · ${year}` : ''}
          </Text>
          {[venue, city].filter(Boolean).length > 0 ? (
            <Text style={styles.flyerLocation} numberOfLines={1}>
              {[venue, city].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        <Text style={styles.flyerCredit}>DISEÑO HOY SALGO</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Ver flyer de ${title || 'evento'} en grande`}
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.flyer}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={25}
        accessible={false}
      />
      <View style={styles.flyerDim} />
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        transition={200}
        accessible={false}
        onError={() => setFailedUri(uri)}
      />
    </TouchableOpacity>
  );
}

export default function HomeScreen({
  onCreateEvent,
  onCreateClub,
  onShowClubs,
  accountEmail,
  userId,
  isAdmin,
  isAuthenticated,
  onSignOut,
  onShowFavorites,
  onShowDataBank,
  onShowDashboard,
  onShowRrpp,
  referral,
  onClearReferral,
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [adminActionId, setAdminActionId] = useState(null);
  const [ticketEvent, setTicketEvent] = useState(null);
  const [viewerEvent, setViewerEvent] = useState(null);

  const openViewerLink = async (url, failureTitle, trackedEventId) => {
    try {
      if (trackedEventId) {
        await openTrackedTicketUrl(url, trackedEventId, (target) => Linking.openURL(target), recordTicketClick);
      } else {
        await Linking.openURL(url);
      }
    } catch (error) {
      Alert.alert(failureTitle, error.message || 'Revisá tu conexión e intentá de nuevo.');
    }
  };
  const [showMyTickets, setShowMyTickets] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedAge, setSelectedAge] = useState('Todas');
  const [selectedDate, setSelectedDate] = useState(ALL_DATES);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [favoriteKeys, setFavoriteKeys] = useState(new Set());
  const seenEventViews = useRef(new Set());
  const currentTime = useCurrentTime();

  const onEventViewableItemsChanged = useCallback(({ viewableItems }) => {
    viewableItems.forEach(({ item, isViewable }) => {
      if (!isViewable || !item?.id) return;
      const eventId = String(item.id);
      if (seenEventViews.current.has(eventId)) return;
      seenEventViews.current.add(eventId);
      recordContentView('event', eventId);
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!userId) {
      Promise.resolve().then(() => {
        if (isMounted) setFavoriteKeys(new Set());
      });
      return () => { isMounted = false; };
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

    return () => { isMounted = false; };
  }, [userId]);

  const updateFavorite = (itemType, itemId, isFavorite) => {
    const key = getFavoriteKey(itemType, itemId);
    setFavoriteKeys((current) => {
      const next = new Set(current);
      if (isFavorite) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const loadEvents = useCallback(async () => {
    try {
      const nextEvents = await fetchEvents(isAdmin);
      setErrorMessage('');
      setEvents(nextEvents);
    } catch (error) {
      setErrorMessage(error?.message || 'Error al cargar eventos.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const refreshEvents = useCallback(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    let isMounted = true;
    fetchEvents(isAdmin)
      .then((nextEvents) => {
        if (isMounted) {
          setEvents(nextEvents);
          setErrorMessage('');
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(error?.message || 'Error de red al cargar eventos.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [isAdmin]);

  const todayKey = getLocalDateKey();
  const hasDateRange = Boolean(dateRange.from || dateRange.to);
  const resetDateFilter = () => {
    setSelectedDate(ALL_DATES);
    setDateRange({ from: '', to: '' });
  };

  const activeEvents = useMemo(
    () => events.filter((event) => !isEventExpired(event.event_date, currentTime, event.event_end_date)),
    [events, currentTime]
  );
  const cityFilters = useMemo(
    () => getAvailableFilterOptions(CITIES, activeEvents.map((event) => event.city)),
    [activeEvents]
  );
  const activeSelectedCity = cityFilters.some((city) => matchesFilterValue(city, selectedCity))
    ? selectedCity
    : 'Todas';
  const matchesOtherFilters = useCallback((event) => {
    const matchCategory =
      selectedCategory === 'Todas' || matchesFilterValue(event.category, selectedCategory);
    const matchCity = activeSelectedCity === 'Todas' || matchesFilterValue(event.city, activeSelectedCity);
    const matchAge = matchesAgeFilter(event.age_range, selectedAge);
    return matchCategory && matchCity && matchAge;
  }, [selectedCategory, activeSelectedCity, selectedAge]);
  const categoryFilters = useMemo(
    () => getEventCategoryOptions(CATEGORIES, activeEvents.map((event) => event.category)),
    [activeEvents]
  );

  const availableDates = useMemo(
    () =>
      sortDateKeysByRelevance(
        [...new Set(
          activeEvents
            .filter(matchesOtherFilters)
            .map((event) => getEventDateKey(event.event_date))
            .filter(Boolean)
        )],
        todayKey
      ),
    [activeEvents, matchesOtherFilters, todayKey]
  );

  const activeSelectedDate =
    selectedDate === ALL_DATES || availableDates.includes(selectedDate)
      ? selectedDate
      : ALL_DATES;

  const filteredEvents = useMemo(() => {
    if (referral) return activeEvents.filter((event) => String(event.id).toLowerCase() === referral.eventId.toLowerCase());
    return sortEventsForDisplay(
      activeEvents.filter((event) => {
        const eventDateKey = getEventDateKey(event.event_date);
        const matchDate = hasDateRange
          ? (!dateRange.from || eventDateKey >= dateRange.from) &&
            (!dateRange.to || eventDateKey <= dateRange.to)
          : activeSelectedDate === ALL_DATES || eventDateKey === activeSelectedDate;
        return matchesOtherFilters(event) && matchDate;
      }),
      todayKey
    );
  }, [activeEvents, matchesOtherFilters, activeSelectedDate, dateRange, hasDateRange, todayKey, referral]);

  const filters = [
    {
      label: 'Ciudad',
      options: cityFilters,
      selected: activeSelectedCity,
      onSelect: (city) => {
        resetDateFilter();
        setSelectedCity(city);
      },
    },
    {
      label: 'Categoría de eventos',
      options: categoryFilters,
      selected: selectedCategory,
      onSelect: (category) => {
        resetDateFilter();
        setSelectedCategory(category);
      },
    },
  ];

  const shareEvent = async (item) => {
    const date = formatEventDate(item.event_date);
    const lines = [
      `🎉 *${item.title}*`,
      item.venue_name ? `🏠 ${item.venue_name}` : null,
      [item.neighborhood, item.city].filter(Boolean).length
        ? `📍 ${[item.neighborhood, item.city].filter(Boolean).join(', ')}` : null,
      date ? `🗓️ ${date}` : null,
      item.age_range ? `🔞 ${item.age_range}` : null,
      item.instagram_url ? `📸 ${item.instagram_url}` : null,
      getTicketShareLine(item.ticket_url),
      '',
      '_Encontrado en Hoy Salgo — tu guía para salir en Uruguay_',
    ].filter((l) => l !== null).join('\n');

    const url = `whatsapp://send?text=${encodeURIComponent(lines)}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(lines)}`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    }
  };

  const handleDeleteEvent = (item) => {
    Alert.alert(
      '¿Borrar evento?',
      `"${item.title}" se eliminará permanentemente de la cartelera.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', item.id);
              if (error) throw error;
              setEvents((prev) => prev.filter((e) => e.id !== item.id));
              setAdminActionId(null);
            } catch (err) {
              Alert.alert('Error al borrar', err.message || 'Intentá de nuevo.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '¿Borrar tu cuenta?',
      'Se eliminarán tu cuenta y tus favoritos de forma permanente. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar cuenta',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_my_account');
              if (error) throw error;
              await supabase.auth.signOut();
              Alert.alert('Cuenta borrada', 'Tu cuenta fue eliminada.');
            } catch (err) {
              Alert.alert('No se pudo borrar la cuenta', err.message || 'Intentá de nuevo.');
            }
          },
        },
      ]
    );
  };

  const handleToggleFeatured = async (item) => {
    const next = !item.is_featured;
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_featured: next })
        .eq('id', item.id);
      if (error) throw error;
      setEvents((prev) =>
        prev.map((e) => (e.id === item.id ? { ...e, is_featured: next } : e))
      );
      setAdminActionId(null);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar.');
    }
  };

  const renderEvent = ({ item }) => {
    const eventAge = getAgeMinimum(item.age_range);
    const ageLabel =
      eventAge === 0
        ? 'Todas las edades'
        : eventAge !== null
          ? `+${eventAge}`
          : '';
    const metadata = [item.neighborhood, item.city].filter(Boolean).join(' · ');
    const categoryDetails = [item.category, ageLabel]
      .filter(Boolean)
      .join(' · ');
    const relatedClub = Array.isArray(item.clubs) ? item.clubs[0] : item.clubs;
    const ticketUrl = normalizeTicketUrl(item.ticket_url);
    const hasTicketSales = INTERNAL_TICKET_SALES_ENABLED && item.ticket_sales_enabled &&
      Number.isFinite(Number(item.ticket_price_uyu)) &&
      Number.isFinite(Number(item.ticket_capacity));
    const ticketsRemaining = hasTicketSales
      ? Number(item.ticket_capacity) - Number(item.tickets_sold || 0) - Number(item.tickets_reserved || 0)
      : 0;
    const mapUrl = getMapsSearchUrl({
      name: item.venue_name || item.title,
      address: relatedClub?.address,
      neighborhood: item.neighborhood,
      city: item.city,
    });

    const openLocation = async () => {
      if (!mapUrl) return;
      try {
        await Linking.openURL(mapUrl);
      } catch (error) {
        Alert.alert(
          'No se pudo abrir el mapa',
          error.message || 'Revisá tu conexión e intentá de nuevo.'
        );
      }
    };

    const openTickets = async () => {
      if (!ticketUrl) return;
      try {
        await openTrackedTicketUrl(ticketUrl, item.id, (url) => Linking.openURL(url), recordTicketClick);
      } catch (error) {
        Alert.alert(
          'No se pudo abrir la ticketera',
          error.message || 'Revisá tu conexión e intentá de nuevo.'
        );
      }
    };

    const openTicketPurchase = () => {
      if (!isAuthenticated) {
        onSignOut?.();
        return;
      }
      if (ticketsRemaining > 0) setTicketEvent(item);
    };

    const isAdminOpen = adminActionId === item.id;

    return (
      <View style={styles.eventCard}>
        <EventFlyer
          uri={item.image_url}
          title={item.title}
          eventDate={item.event_date}
          venue={item.venue_name}
          city={item.city}
          logo={getClubLogoSource(relatedClub?.id, relatedClub?.logo_url)}
          onPress={() => setViewerEvent({ ...item, mapUrl, ticketUrl })}
        />
        <EventPageButton ticketUrl={item.ticket_url} title={item.title} />

        {isAdmin ? (
          <View style={styles.adminOverlay}>
            <TouchableOpacity
              style={styles.adminToggleBtn}
              onPress={() => setAdminActionId(isAdminOpen ? null : item.id)}
              accessibilityRole="button"
              accessibilityLabel="Opciones de administrador"
            >
              <Text style={styles.adminToggleBtnText}>{isAdminOpen ? '✕' : '⚙'}</Text>
            </TouchableOpacity>
            {isAdminOpen ? (
              <View style={styles.adminPanel}>
                <TouchableOpacity
                  style={[styles.adminAction, styles.adminActionEdit]}
                  onPress={() => { setAdminActionId(null); onCreateEvent?.(null, item); }}
                  accessibilityRole="button"
                >
                  <Text style={styles.adminActionText}>✏️ Editar evento</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.adminAction, styles.adminActionFeatured]}
                  onPress={() => handleToggleFeatured(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.adminActionText}>
                    {item.is_featured ? '☆ Quitar destacado' : '★ Destacar'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.adminAction, styles.adminActionDelete]}
                  onPress={() => handleDeleteEvent(item)}
                  accessibilityRole="button"
                >
                  <Text style={styles.adminActionText}>🗑️ Borrar evento</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.eventDetails}>
          <View style={styles.eventTopRow}>
            <Text style={styles.eventDate}>{formatEventDate(item.event_date)}</Text>
            <FavoriteButton
              userId={userId}
              itemType="event"
              itemId={item.id}
              itemData={{
                title: item.title,
                venue_name: item.venue_name,
                city: item.city,
                event_date: item.event_date,
                image_url: item.image_url,
              }}
              isFavorite={favoriteKeys.has(getFavoriteKey('event', item.id))}
              onFavoriteChange={(isFavorite) => updateFavorite('event', item.id, isFavorite)}
              onSignIn={onSignOut}
            />
          </View>
          <View style={styles.eventTitleRow}>
            <Text style={styles.eventTitle}>{item.title || 'Evento'}</Text>
            {item.is_featured ? (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>DESTACADO</Text>
              </View>
            ) : null}
          </View>
          {item.venue_name ? <Text style={styles.venue}>{item.venue_name}</Text> : null}
          {metadata ? <Text style={styles.metadata}>{metadata}</Text> : null}
          {categoryDetails ? <Text style={styles.categoryDetails}>{categoryDetails}</Text> : null}
          {hasTicketSales ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Comprar entrada para ${item.title || 'el evento'}`}
              onPress={openTicketPurchase}
              disabled={ticketsRemaining <= 0}
              style={[styles.ticketButton, ticketsRemaining <= 0 && styles.ticketButtonDisabled]}
            >
              <Text style={styles.ticketButtonText}>
                {ticketsRemaining > 0
                  ? `🎟  Comprar · UYU $${Number(item.ticket_price_uyu).toFixed(2)}`
                  : '🎟  Entradas agotadas'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {ticketUrl ? (
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel={`Ver entradas para ${item.title || 'el evento'}`}
              onPress={openTickets}
              style={styles.ticketButton}
            >
              <Text style={styles.ticketButtonText}>
                {hasTicketSales ? '↗  Otras opciones de entradas' : '🎟  Ver entradas'}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TicketSalesInquiryButton event={{
            title: item.title,
            date: item.event_date,
            venue: item.venue_name,
            city: item.city,
            description: item.description,
            ticketUrl: item.ticket_url,
            ticketSalesEnabled: item.ticket_sales_enabled,
          }} />
          {mapUrl ? (
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel={`Ver ubicación del evento ${item.title || ''} en el mapa`}
              onPress={openLocation}
              style={styles.mapButton}
            >
              <Text style={styles.mapButtonText}>▤  Cómo llegar</Text>
            </TouchableOpacity>
          ) : null}
          <InstagramButton value={item.instagram_url} label={item.title || 'el evento'} />
          {item.description ? (
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => shareEvent(item)}
            accessibilityRole="button"
            accessibilityLabel={`Compartir ${item.title}`}
          >
            <Text style={styles.shareButtonText}>📤  Compartir por WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderListHeader = () => (
    <View>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <Text style={styles.brand}>HOY SALGO</Text>
          {isAuthenticated ? (
            <View>
              <Text numberOfLines={1} style={styles.headerSubtitle}>
                Cuenta: {accountEmail || 'correo no disponible'}
              </Text>
              <Text style={[styles.accountRole, isAdmin && styles.accountRoleAdmin]}>
                {isAdmin ? 'Administrador habilitado' : 'Cuenta de usuario'}
              </Text>
            </View>
          ) : (
            <Text style={styles.headerSubtitle}>Tu guía para salir en Uruguay</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Abrir espacio RRPP"
            onPress={onShowRrpp}
            style={styles.dashboardButton}
          >
            <Text style={styles.dashboardButtonText}>RRPP</Text>
          </TouchableOpacity>
          {INTERNAL_TICKET_SALES_ENABLED && isAuthenticated ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Ver mis entradas"
              onPress={() => setShowMyTickets(true)}
              style={styles.dashboardButton}
            >
              <Text style={styles.dashboardButtonIcon}>🎟</Text>
              <Text style={styles.dashboardButtonText}>Mis entradas</Text>
            </TouchableOpacity>
          ) : null}
          {isAdmin && isAuthenticated && onShowDashboard ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Abrir panel de administración"
              onPress={onShowDashboard}
              style={styles.dashboardButton}
            >
              <Text style={styles.dashboardButtonIcon}>▦</Text>
              <Text style={styles.dashboardButtonText}>Panel</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isAuthenticated ? 'Cerrar sesión' : 'Iniciar sesión'}
            onPress={onSignOut}
            style={styles.signOutButton}
          >
            <Text style={styles.signOut}>{isAuthenticated ? 'Salir' : 'Ingresar'}</Text>
          </TouchableOpacity>
          {isAuthenticated ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Borrar mi cuenta"
              onPress={handleDeleteAccount}
              style={styles.signOutButton}
            >
              <Text style={styles.signOut}>Borrar cuenta</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <PromotionWhatsAppButton />
      {referral ? (
        <View style={styles.ticketAnnouncement}>
          <Text style={styles.ticketAnnouncementTitle}>Evento compartido por RRPP</Text>
          <Text style={styles.ticketAnnouncementText}>Código: {referral.code}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={onClearReferral} style={styles.backToEventsButton}>
            <Text style={styles.ticketAnnouncementLabel}>VER TODOS LOS EVENTOS</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>IDEAS PARA DISFRUTAR</Text>
        <Text style={styles.heroTitle}>¿Qué pinta{"\n"}hoy?</Text>
        <Text style={styles.heroDescription}>
          Descubrí qué hacer hoy cerca tuyo.
        </Text>
        <View style={styles.ticketAnnouncement}>
          <Text style={styles.ticketAnnouncementLabel}>PRÓXIMAMENTE</Text>
          <Text style={styles.ticketAnnouncementTitle}>Entradas en Hoy Salgo</Text>
          <Text style={styles.ticketAnnouncementText}>
            Estamos preparando la venta de entradas desde la app.
          </Text>
        </View>
      </View>

      <View style={styles.filtersCard}>
        <Text style={styles.filtersTitle}>Filtrá los eventos</Text>
        <View style={styles.ageFilterCard}>
          <View style={styles.ageFilterHeading}>
            <Text style={styles.ageFilterTitle}>EDAD MÍNIMA</Text>
          </View>
          <View style={styles.ageChipRow}>
            {AGE_FILTERS.map((age) => {
              const isSelected = selectedAge === age;
              const label = age === 'Todas' ? 'Cualquier edad' : age;

              return (
                <TouchableOpacity
                  key={age}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    resetDateFilter();
                    setSelectedAge(age);
                  }}
                  style={[styles.chip, styles.ageChip, isSelected && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.pinnedFilterRows}>
          {filters.map(({ label, options, selected, onSelect }) => (
            <View key={label} style={styles.pinnedFilterRow}>
              <Text style={styles.filterLabel}>{label}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pinnedChipRow}
              >
                {options.map((option) => {
                  const isSelected = selected === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => onSelect(option)}
                      style={[styles.chip, styles.pinnedChip, isSelected && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))}
          <View style={styles.pinnedFilterRow}>
            <Text style={styles.filterLabel}>Fecha</Text>
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
              contentContainerStyle={styles.pinnedChipRow}
            >
              {[ALL_DATES, ...availableDates].map((date) => {
                const isAllDates = date === ALL_DATES;
                const isSelected = !hasDateRange && activeSelectedDate === date;
                return (
                  <TouchableOpacity
                    key={date}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      setDateRange({ from: '', to: '' });
                      setSelectedDate(date);
                    }}
                    style={[styles.chip, styles.pinnedChip, isSelected && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                      {isAllDates
                        ? date
                        : date === todayKey
                          ? 'Hoy'
                          : formatEventDay(date)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {availableDates.length === 0 ? (
              <Text style={styles.noDatesHint}>
                Todavía no hay fechas publicadas para estos filtros.
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <Text style={styles.listHeading}>
        {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
        {hasDateRange
          ? ` · ${
              dateRange.from && dateRange.to
                ? `${formatEventDay(dateRange.from)} – ${formatEventDay(dateRange.to)}`
                : dateRange.from
                  ? `Desde ${formatEventDay(dateRange.from)}`
                  : `Hasta ${formatEventDay(dateRange.to)}`
            }`
          : activeSelectedDate === ALL_DATES
          ? ' · Hoy primero'
          : activeSelectedDate === todayKey
            ? ' · Hoy'
            : ` · ${formatEventDay(activeSelectedDate)}`}
      </Text>
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      if (referral) {
        return (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Evento no disponible</Text>
            <Text style={styles.stateMessage}>Este evento no está disponible o ya finalizó. Podés volver a ver todos los eventos.</Text>
          </View>
        );
      }

      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#FF5573" />
          <Text style={styles.stateMessage}>Buscando buenos planes…</Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>No pudimos cargar los eventos</Text>
          <Text style={styles.stateMessage}>{errorMessage}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={refreshEvents}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Text style={styles.emptyIcon}>✦</Text>
        <Text style={styles.stateTitle}>
          {events.length && !activeEvents.length
            ? 'No hay eventos vigentes'
            : events.length
              ? 'No encontramos planes'
              : 'Todavía no hay eventos'}
        </Text>
        <Text style={styles.stateMessage}>
          {events.length && !activeEvents.length
            ? 'Los eventos dejan de aparecer cuando pasa su fecha y hora.'
            : events.length
            ? 'Probá cambiar o quitar alguno de los filtros.'
            : 'Cuando se publiquen nuevos eventos, los vas a encontrar acá.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={errorMessage ? [] : filteredEvents}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderEvent}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshEvents}
            tintColor="#FF5573"
            colors={['#FF5573']}
          />
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={5}
        onViewableItemsChanged={onEventViewableItemsChanged}
        viewabilityConfig={EVENT_VIEWABILITY_CONFIG}
      />
      <EventFlyerViewer
        event={viewerEvent}
        onClose={() => setViewerEvent(null)}
        onOpenTickets={viewerEvent?.ticketUrl
          ? () => openViewerLink(viewerEvent.ticketUrl, 'No se pudo abrir la ticketera', viewerEvent.id)
          : null}
        onOpenMap={viewerEvent?.mapUrl
          ? () => openViewerLink(viewerEvent.mapUrl, 'No se pudo abrir el mapa')
          : null}
      />
      {INTERNAL_TICKET_SALES_ENABLED ? (
        <>
          <TicketPurchaseModal
            event={ticketEvent}
            visible={Boolean(ticketEvent)}
            onClose={() => setTicketEvent(null)}
            linkedRrppCode={referral && ticketEvent?.id === referral.eventId ? referral.code : ''}
          />
          <MyTicketsModal
            visible={showMyTickets}
            userId={userId}
            onClose={() => setShowMyTickets(false)}
          />
        </>
      ) : null}

      <View style={styles.bottomNavigation}>
        {onShowClubs ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Ver boliches y sus eventos"
            onPress={onShowClubs}
            style={styles.bottomNavigationButton}
          >
            <Text style={styles.bottomNavigationIcon}>♫</Text>
            <Text style={styles.bottomNavigationLabel}>Boliches</Text>
          </TouchableOpacity>
        ) : null}

        {isAuthenticated ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Ver mis favoritos"
            onPress={onShowFavorites}
            style={styles.bottomNavigationButton}
          >
            <Text style={styles.bottomNavigationIcon}>♥</Text>
            <Text style={styles.bottomNavigationLabel}>Guardados</Text>
          </TouchableOpacity>
        ) : null}

        {onShowDataBank ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Banco de datos"
            onPress={onShowDataBank}
            style={styles.bottomNavigationButton}
          >
            <Text style={styles.bottomNavigationIcon}>◯</Text>
            <Text style={styles.bottomNavigationLabel}>Banco datos</Text>
          </TouchableOpacity>
        ) : null}

        {isAdmin && isAuthenticated && onCreateEvent ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Publicar evento"
            onPress={onCreateEvent}
            style={styles.bottomNavigationButton}
          >
            <Text style={styles.bottomNavigationIcon}>＋</Text>
            <Text style={styles.bottomNavigationLabel}>Publicar evento</Text>
          </TouchableOpacity>
        ) : null}

        {isAdmin && isAuthenticated && onCreateClub ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Agregar boliche"
            onPress={onCreateClub}
            style={styles.bottomNavigationButton}
          >
            <Text style={styles.bottomNavigationIcon}>◉</Text>
            <Text style={styles.bottomNavigationLabel}>Agregar boliche</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 112 },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 14,
    rowGap: 10,
  },
  headerIdentity: { flex: 1, minWidth: 150 },
  headerActions: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
  brand: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1.2 },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  accountRole: { fontSize: 11, color: '#64748B', marginTop: 1 },
  accountRoleAdmin: { color: '#38BDF8', fontWeight: '600' },
  signOutButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#182235',
    borderWidth: 1,
    borderColor: '#2A3850',
  },
  signOut: { color: '#E2E8F0', fontSize: 13, fontWeight: '600' },
  dashboardButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#151F30',
    borderWidth: 1,
    borderColor: '#2A3850',
  },
  dashboardButtonIcon: { color: '#7DD3FC', fontSize: 15, fontWeight: '800' },
  dashboardButtonText: { color: '#7DD3FC', fontSize: 12, fontWeight: '700' },

  hero: {
    backgroundColor: '#111A2A',
    borderColor: '#243149',
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
    marginTop: 6,
    marginBottom: 10,
  },
  eyebrow: { color: '#FF8195', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { fontSize: 34, lineHeight: 38, fontWeight: '900', color: '#FFF', marginVertical: 7 },
  heroDescription: { color: '#A8B4C7', fontSize: 14, lineHeight: 20 },
  ticketAnnouncement: {
    backgroundColor: '#22213A',
    borderColor: '#51394F',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  ticketAnnouncementLabel: { color: '#FF9AAB', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  ticketAnnouncementTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 5 },
  ticketAnnouncementText: { color: '#C4BBD1', fontSize: 12, lineHeight: 18, marginTop: 4 },
  backToEventsButton: { minHeight: 40, justifyContent: 'center', marginTop: 4 },

  clubsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111A2A',
    padding: 16,
    borderRadius: 18,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  clubsButtonTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  clubsButtonSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  clubsButtonArrow: { color: '#FF5573', fontSize: 24, fontWeight: 'bold' },

  filtersCard: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#243149',
  },
  filtersTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  ageFilterCard: { marginBottom: 12 },
  ageFilterHeading: { marginBottom: 8 },
  ageFilterTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  ageChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pinnedFilterRows: { gap: 12 },
  pinnedFilterRow: {},
  filterLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  pinnedChipRow: { gap: 6, paddingVertical: 2 },
  chip: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#192438',
    borderWidth: 1,
    borderColor: '#2B3951',
  },
  ageChip: { marginBottom: 4 },
  pinnedChip: {},
  chipActive: { backgroundColor: '#D83E60', borderColor: '#F56B83' },
  chipText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  noDatesHint: { color: '#64748B', fontSize: 12, fontStyle: 'italic', marginTop: 8 },

  listHeading: { color: '#A8B4C7', fontSize: 13, fontWeight: '700', marginVertical: 16 },

  eventCard: {
    backgroundColor: '#111A2A',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#243149',
    elevation: 3,
  },
  flyer: { width: '100%', height: 400, backgroundColor: '#0A0E17' },
  flyerDim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5, 7, 13, 0.55)' },
  flyerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flyerLogo: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#67E8F9' },
  flyerPlaceholder: {
    width: '100%',
    height: 240,
    backgroundColor: '#101A34',
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 18,
    justifyContent: 'space-between',
  },
  flyerAccentCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -50,
    borderWidth: 28,
    borderColor: '#243E66',
  },
  flyerBrand: {
    color: '#67E8F9',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  flyerTextContent: {
    alignItems: 'flex-start',
    paddingRight: 20,
  },
  flyerPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },
  flyerDate: {
    color: '#67E8F9',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  flyerLocation: {
    color: '#D5DFF0',
    fontSize: 12,
    marginTop: 3,
  },
  flyerCredit: {
    color: '#A8B4C7',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },

  adminOverlay: { position: 'absolute', top: 12, right: 12, zIndex: 10 },
  adminToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  adminToggleBtnText: { color: '#38BDF8', fontSize: 16, fontWeight: 'bold' },
  adminPanel: {
    position: 'absolute',
    top: 42,
    right: 0,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#334155',
    width: 160,
  },
  adminAction: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginVertical: 2 },
  adminActionEdit: { backgroundColor: '#1E293B' },
  adminActionFeatured: { backgroundColor: '#1E293B' },
  adminActionDelete: { backgroundColor: '#451A03' },
  adminActionText: { color: '#F1F5F9', fontSize: 12, fontWeight: '600' },

  eventDetails: { padding: 18 },
  eventTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 34 },
  eventDate: {
    color: '#FF9AAB',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    backgroundColor: '#2B1D2A',
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  eventTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 8 },
  eventTitle: { color: '#FFF', fontSize: 19, lineHeight: 24, fontWeight: '800', flex: 1 },
  featuredBadge: {
    backgroundColor: '#3B2E18',
    borderColor: '#80632D',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredBadgeText: { color: '#F6D68A', fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  venue: { color: '#DCE4EF', fontSize: 14, fontWeight: '700', marginTop: 6 },
  metadata: { color: '#A8B4C7', fontSize: 13, marginTop: 4 },
  categoryDetails: { color: '#77869D', fontSize: 12, marginTop: 5 },

  mapButton: {
    marginTop: 10,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18263A',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2B405A',
    alignSelf: 'flex-start',
  },
  mapButtonText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },
  ticketButton: {
    marginTop: 10,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E94F6D',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  ticketButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  ticketButtonDisabled: { backgroundColor: '#475569' },
  description: { color: '#A8B4C7', fontSize: 14, marginTop: 12, lineHeight: 21 },
  shareButton: {
    marginTop: 14,
    minHeight: 44,
    backgroundColor: '#123A34',
    borderColor: '#1F5B50',
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: { color: '#92E6C6', fontSize: 13, fontWeight: '800' },

  stateContainer: { padding: 40, alignItems: 'center' },
  stateCard: {
    backgroundColor: '#111A2A',
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243149',
  },
  stateTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 12 },
  stateMessage: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyIcon: { fontSize: 32, color: '#FF5573', marginBottom: 4 },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#E94F6D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D1422',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderTopColor: '#243149',
  },
  bottomNavigationButton: { alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: 44, paddingHorizontal: 2 },
  bottomNavigationIcon: { fontSize: 20, color: '#94A3B8' },
  bottomNavigationLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
});
