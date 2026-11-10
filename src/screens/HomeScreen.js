
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import AdBannerCarousel from './AddBannerCarrousel';
import InstagramButton from '../components/InstagramButton';
import DateRangeFilter from '../components/DateRangeFilter';

const CITY_FILTERS = ['Todas', ...CITIES];
const CATEGORY_FILTERS = ['Todas', ...CATEGORIES];
const AGE_FILTERS = ['Todas', ...AGE_RANGES];
const ALL_DATES = 'Todas las fechas';
const EVENTS_REQUEST_TIMEOUT_MS = 12000;

const fetchEvents = async () => {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, EVENTS_REQUEST_TIMEOUT_MS);

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, clubs(address)')
      .order('created_at', { ascending: false })
      .abortSignal(controller.signal);

    if (timedOut) {
      throw new Error('La conexión tardó demasiado. Revisá internet e intentá de nuevo.');
    }
    if (error) throw error;
    return Array.isArray(data) ? data : [];
  } finally {
    clearTimeout(timeout);
  }
};

function EventFlyer({ uri, title }) {
  const [hasError, setHasError] = useState(false);

  if (!uri || hasError) {
    return (
      <View style={styles.flyerPlaceholder}>
        <Text style={styles.flyerPlaceholderText}>{title || 'HOY SALGO'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={styles.flyer}
      resizeMode="contain"
      accessibilityLabel={`Flyer de ${title || 'evento'}`}
      onError={() => setHasError(true)}
    />
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
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [adminActionId, setAdminActionId] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedAge, setSelectedAge] = useState('Todas');
  const [selectedDate, setSelectedDate] = useState(ALL_DATES);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [favoriteKeys, setFavoriteKeys] = useState(new Set());
  const currentTime = useCurrentTime();

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
      const nextEvents = await fetchEvents();
      setErrorMessage('');
      setEvents(nextEvents);
    } catch (error) {
      setErrorMessage(error?.message || 'Error al cargar eventos.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshEvents = useCallback(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    let isMounted = true;
    fetchEvents()
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
  }, []);

  const todayKey = getLocalDateKey();
  const hasDateRange = Boolean(dateRange.from || dateRange.to);
  const resetDateFilter = () => {
    setSelectedDate(ALL_DATES);
    setDateRange({ from: '', to: '' });
  };

  const matchesOtherFilters = useCallback((event) => {
    const matchCategory =
      selectedCategory === 'Todas' || event.category === selectedCategory;
    const matchCity = selectedCity === 'Todas' || event.city === selectedCity;
    const matchAge = matchesAgeFilter(event.age_range, selectedAge);
    return matchCategory && matchCity && matchAge;
  }, [selectedCategory, selectedCity, selectedAge]);

  const activeEvents = useMemo(
    () => events.filter((event) => !isEventExpired(event.event_date, currentTime)),
    [events, currentTime]
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
  }, [activeEvents, matchesOtherFilters, activeSelectedDate, dateRange, hasDateRange, todayKey]);

  const filters = [
    {
      label: 'Ciudad',
      options: CITY_FILTERS,
      selected: selectedCity,
      onSelect: (city) => {
        resetDateFilter();
        setSelectedCity(city);
      },
    },
    {
      label: 'Categoría',
      options: CATEGORY_FILTERS,
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

    const isAdminOpen = adminActionId === item.id;

    return (
      <View style={styles.eventCard}>
        <EventFlyer uri={item.image_url} title={item.title} />

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
        <View>
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
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isAuthenticated ? 'Cerrar sesión' : 'Iniciar sesión'}
          onPress={onSignOut}
          style={styles.signOutButton}
        >
          <Text style={styles.signOut}>{isAuthenticated ? 'Salir' : 'Ingresar'}</Text>
        </TouchableOpacity>
      </View>

      <PromotionWhatsAppButton />

      {/* Carrusel de publicidad */}
      <AdBannerCarousel />

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>IDEAS PARA DISFRUTAR</Text>
        <Text style={styles.heroTitle}>¿Qué pinta{"\n"}hoy?</Text>
        <Text style={styles.heroDescription}>
          Descubrí qué hacer hoy cerca tuyo.
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onShowClubs}
        style={styles.clubsButton}
      >
        <View>
          <Text style={styles.clubsButtonTitle}>Búsqueda rápida</Text>
          <Text style={styles.clubsButtonSubtitle}>Encontrá boliches y lugares para salir</Text>
        </View>
        <Text style={styles.clubsButtonArrow}>›</Text>
      </TouchableOpacity>

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
      />
      <View style={styles.bottomNavigation}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Abrir búsqueda rápida"
          onPress={onShowClubs}
          style={styles.bottomNavigationButton}
        >
          <Text style={styles.bottomNavigationIcon}>♫</Text>
          <Text style={styles.bottomNavigationLabel}>Buscar</Text>
        </TouchableOpacity>
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
        {onShowDashboard ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Dashboard"
            onPress={onShowDashboard}
            style={styles.bottomNavigationButton}
          >
            <Text style={styles.bottomNavigationIcon}>📊</Text>
            <Text style={styles.bottomNavigationLabel}>Dashboard</Text>
          </TouchableOpacity>
        ) : null}
        {isAdmin && isAuthenticated && onCreateEvent && onCreateClub ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Publicar evento"
            onPress={() => onCreateEvent()}
            style={styles.bottomNavigationButton}
          >
            <Text style={styles.bottomNavigationIcon}>＋</Text>
            <Text style={styles.bottomNavigationLabel}>Publicar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  listContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  brand: { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  accountRole: { fontSize: 11, color: '#64748B', marginTop: 1 },
  accountRoleAdmin: { color: '#38BDF8', fontWeight: '600' },
  signOutButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  signOut: { color: '#E2E8F0', fontSize: 13, fontWeight: '600' },

  hero: { marginVertical: 8 },
  eyebrow: { color: '#FF5573', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  heroTitle: { fontSize: 32, fontWeight: '900', color: '#FFF', marginVertical: 4 },
  heroDescription: { color: '#94A3B8', fontSize: 14 },

  clubsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131C2E',
    padding: 16,
    borderRadius: 16,
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
    borderColor: '#1E293B',
  },
  filtersTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  ageFilterCard: { marginBottom: 12 },
  ageFilterHeading: { marginBottom: 8 },
  ageFilterTitle: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  ageChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pinnedFilterRows: { gap: 12 },
  pinnedFilterRow: {},
  filterLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  pinnedChipRow: { gap: 6, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A233A',
    borderWidth: 1,
    borderColor: '#26334D',
  },
  ageChip: { marginBottom: 4 },
  pinnedChip: {},
  chipActive: { backgroundColor: '#FF5573', borderColor: '#FF5573' },
  chipText: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  noDatesHint: { color: '#64748B', fontSize: 12, fontStyle: 'italic', marginTop: 8 },

  listHeading: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginVertical: 16 },

  eventCard: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  flyer: { width: '100%', height: 220, backgroundColor: '#0A0E17' },
  flyerPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#1A233A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flyerPlaceholderText: { color: '#64748B', fontWeight: '800', letterSpacing: 2 },

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

  eventDetails: { padding: 16 },
  eventTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventDate: { color: '#FF5573', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  eventTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  eventTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  featuredBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  venue: { color: '#E2E8F0', fontSize: 14, fontWeight: '600', marginTop: 4 },
  metadata: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  categoryDetails: { color: '#64748B', fontSize: 12, marginTop: 2 },

  mapButton: {
    marginTop: 10,
    backgroundColor: '#1A233A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mapButtonText: { color: '#38BDF8', fontSize: 13, fontWeight: '600' },
  description: { color: '#94A3B8', fontSize: 14, marginTop: 10, lineHeight: 20 },
  shareButton: {
    marginTop: 14,
    backgroundColor: '#065F46',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  shareButtonText: { color: '#6EE7B7', fontSize: 14, fontWeight: 'bold' },

  stateContainer: { padding: 40, alignItems: 'center' },
  stateCard: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  stateTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginTop: 12 },
  stateMessage: { color: '#94A3B8', fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  emptyIcon: { fontSize: 32, color: '#FF5573', marginBottom: 4 },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#FF5573',
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
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  bottomNavigationButton: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  bottomNavigationIcon: { fontSize: 20, color: '#94A3B8' },
  bottomNavigationLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
});
