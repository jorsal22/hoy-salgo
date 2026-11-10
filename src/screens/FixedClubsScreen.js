import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { isAdminUser } from '../config/admin';
import { AGE_RANGES, CITIES } from '../constants/eventOptions';
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
import InstagramButton from '../components/InstagramButton';
import DateRangeFilter from '../components/DateRangeFilter';

const CITY_FILTERS = ['Todas', ...CITIES];
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

const fetchClubs = async () => {
  const [clubsResult, eventsResult] = await Promise.all([
    supabase
      .from('clubs')
      .select('id, name, city, neighborhood, address, phone, logo_url, instagram_url')
      .order('name', { ascending: true }),
    supabase
      .from('events')
      .select('club_id, title, event_date, age_range')
      .not('club_id', 'is', null)
      .order('event_date', { ascending: true, nullsFirst: false }),
  ]);
  if (clubsResult.error) throw clubsResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const clubsById = new Map();
  for (const savedClub of clubsResult.data || []) {
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
      events: [],
    });
  }

  for (const event of eventsResult.data || []) {
    const club = clubsById.get(event.club_id);
    if (!club) continue;

    club.events.push({
      title: event.title?.trim() || 'Evento',
      eventDate: event.event_date,
      dateKey: getEventDateKey(event.event_date),
      ageRange: event.age_range,
    });
  }

  return [...clubsById.values()].sort((first, second) =>
    first.name.localeCompare(second.name)
  );
};

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
  const [selectedDate, setSelectedDate] = useState(ALL_DATES);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [deletingClubId, setDeletingClubId] = useState(null);
  const [expandedClubId, setExpandedClubId] = useState(null);
  const currentTime = useCurrentTime();
  const hasDateRange = Boolean(dateRange.from || dateRange.to);

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
            club.databaseId === selectedClubId &&
            club.events.some(
              (event) =>
                event.dateKey === selectedDate &&
                !isEventExpired(event.eventDate, currentTime) &&
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
      const nextClubs = await fetchClubs();
      setClubs(nextClubs);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getLoadErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchClubs()
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
  }, []);

  const filteredClubs = useMemo(() => {
    const byCity =
      selectedCity === 'Todas'
        ? clubs
        : clubs.filter((club) => club.city === selectedCity);
    const byClub =
      selectedClubId === 'Todos'
        ? byCity
        : byCity.filter((club) => club.databaseId === selectedClubId);

    return byClub
      .map((club) => ({
        ...club,
        visibleEvents:
          club.events.filter(
            (event) =>
              !isEventExpired(event.eventDate, currentTime) &&
              matchesAgeFilter(event.ageRange, selectedAge) &&
              (selectedClubId === 'Todos' ||
                (hasDateRange
                  ? (!dateRange.from || event.dateKey >= dateRange.from) &&
                    (!dateRange.to || event.dateKey <= dateRange.to)
                  : activeSelectedDate === ALL_DATES ||
                    event.dateKey === activeSelectedDate))
          ),
      }))
      .filter(
        (club) =>
          selectedClubId === 'Todos' ||
          (!hasDateRange && activeSelectedDate === ALL_DATES) ||
          club.visibleEvents.length > 0
      );
  }, [
    clubs,
    selectedCity,
    selectedClubId,
    selectedAge,
    activeSelectedDate,
    currentTime,
    dateRange,
    hasDateRange,
  ]);

  const availableDates = useMemo(() => {
    if (selectedClubId === 'Todos') return [];
    const selectedClub = clubs.find(
      (club) => club.databaseId === selectedClubId
    );
    if (!selectedClub) return [];

    return sortDateKeysByRelevance(
      [...new Set(
        selectedClub.events
          .filter((event) => !isEventExpired(event.eventDate, currentTime))
          .filter((event) => matchesAgeFilter(event.ageRange, selectedAge))
          .map((event) => event.dateKey)
          .filter(Boolean)
      )]
    );
  }, [clubs, selectedClubId, selectedAge, currentTime]);

  const clubsInCity = useMemo(
    () =>
      selectedCity === 'Todas'
        ? clubs
        : clubs.filter((club) => club.city === selectedCity),
    [clubs, selectedCity]
  );
  const selectedClub = clubsInCity.find(
    (club) => club.databaseId === selectedClubId
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
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpandedClubId(isExpanded ? null : item.databaseId)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} — toca para ver eventos`}
      >
      <View style={[styles.clubCard, isExpanded && styles.clubCardExpanded]}>
        {item.logoUrl ? (
          <Image
            source={{ uri: item.logoUrl }}
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
          <View style={styles.clubNameRow}>
            <Text style={styles.clubName}>{item.name}</Text>
            <FavoriteButton
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
            />
          </View>
          {[item.neighborhood, item.city].filter(Boolean).length ? (
            <Text style={styles.location}>
              {[item.neighborhood, item.city].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
                    {item.address ? <Text style={styles.location}>{item.address}</Text> : null}

          {/* Eventos expandibles */}
          {isExpanded ? (
            <View style={styles.eventsExpanded}>
              <Text style={styles.eventsExpandedTitle}>
                {item.visibleEvents.length
                  ? `${item.visibleEvents.length} ${item.visibleEvents.length === 1 ? 'evento próximo' : 'eventos próximos'}`
                  : 'Sin eventos próximos'}
              </Text>
              {item.visibleEvents.length === 0 ? (
                <Text style={styles.noEventsText}>Este boliche no tiene eventos cargados por el momento.</Text>
              ) : null}
              {item.visibleEvents.map((event, index) => (
                <View key={`${event.dateKey}-${index}`} style={styles.eventRow}>
                  <View style={styles.eventRowLeft}>
                    <Text style={styles.eventRowDate}>{formatEventDate(event.eventDate)}</Text>
                    <Text style={styles.eventRowTitle}>{event.title}</Text>
                    {event.ageRange ? <Text style={styles.eventRowAge}>{event.ageRange}</Text> : null}
                  </View>
                  <Text style={styles.eventRowDot}>✦</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.eventCount}>
              {item.visibleEvents.length
                ? `${item.visibleEvents.length} ${item.visibleEvents.length === 1 ? 'evento próximo' : 'eventos próximos'} · toca para ver`
                : 'Tocar para ver detalle'}
            </Text>
          )}

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
          <Text style={styles.eventCount}>
            {item.visibleEvents.length
              ? `${item.visibleEvents.length} ${
                  item.visibleEvents.length === 1 ? 'fecha publicada' : 'fechas publicadas'
                }`
              : selectedClubId === item.databaseId
                ? 'Sin eventos asociados'
                : 'Boliche fijo'}
          </Text>
          {item.visibleEvents.slice(0, 3).map((event, index) => (
            <View key={`${event.dateKey}-${index}`} style={styles.clubEvent}>
              <Text style={styles.eventDate}>
                {formatEventDate(event.eventDate)} · {event.title}
              </Text>
              {event.ageRange ? (
                <Text style={styles.eventAge}>Público: {event.ageRange}</Text>
              ) : null}
            </View>
          ))}
          {item.visibleEvents.length > 3 ? (
            <Text style={styles.moreDates}>
              +{item.visibleEvents.length - 3} fechas más
            </Text>
          ) : null}
          <ClubWhatsAppButton clubName={item.name} phone={item.phone} />
          <InstagramButton value={item.instagramUrl} label={item.name} />
          {/* Flecha indicador */}
          <Text style={styles.expandArrow}>{isExpanded ? '▲ Cerrar' : '▼ Ver eventos'}</Text>
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
      </View>
      </TouchableOpacity>
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
            ? (hasDateRange || activeSelectedDate !== ALL_DATES || selectedAge !== 'Todas') &&
              selectedClubId !== 'Todos'
              ? 'No hay eventos para estos filtros'
              : 'No hay boliches en esta ciudad'
            : 'Todavía no hay boliches'}
        </Text>
        <Text style={styles.stateMessage}>
          {clubs.length
            ? (hasDateRange || activeSelectedDate !== ALL_DATES || selectedAge !== 'Todas') &&
              selectedClubId !== 'Todos'
              ? 'Probá otro rango o edad, o limpiá los filtros para ver los demás eventos de este boliche.'
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
            <Text style={styles.filterTitle}>Filtrar por ciudad</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {CITY_FILTERS.map((city) => {
                const isSelected = selectedCity === city;
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
                const isSelected = selectedClubId === clubOption.id;
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
            {selectedClubId !== 'Todos' ? (
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
              {selectedClubId === 'Todos'
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131A2B',
    borderColor: '#202B40',
    borderWidth: 1,
    borderRadius: 18,
    padding: 15,
    marginBottom: 12,
  },
  clubIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#30213C',
    borderRadius: 15,
    marginRight: 13,
  },
  clubLogo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 13,
    backgroundColor: '#30213C',
  },
  clubIconText: { color: '#FF9AAB', fontSize: 23, fontWeight: '800' },
  clubDetails: { flex: 1 },
  clubNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clubName: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  location: { color: '#CBD5E1', fontSize: 12, marginTop: 5 },
  clubEvent: { marginTop: 6 },
  eventDate: { color: '#FF9AAB', fontSize: 11, lineHeight: 16, marginTop: 6 },
  eventAge: { color: '#CBD5E1', fontSize: 10, marginTop: 2 },
  moreDates: { color: '#94A3B8', fontSize: 11, marginTop: 5 },
  mapButton: {
    alignSelf: 'flex-start',
    minHeight: 34,
    justifyContent: 'center',
    backgroundColor: '#172D3A',
    borderColor: '#2A5968',
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 12,
    marginTop: 9,
  },
  mapButtonText: { color: '#A5E8F3', fontSize: 11, fontWeight: '800' },
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
  eventCount: { color: '#94A3B8', fontSize: 11, marginTop: 7 },
  clubCardExpanded: {
    borderColor: '#FF5573',
    backgroundColor: '#171F33',
  },
  expandArrow: {
    color: '#FF9AAB',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 10,
    letterSpacing: 0.5,
  },
  eventsExpanded: {
    marginTop: 12,
    backgroundColor: '#0F1726',
    borderRadius: 12,
    borderColor: '#1E2D45',
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  eventsExpandedTitle: {
    color: '#FF9AAB',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  noEventsText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2D45',
  },
  eventRowLeft: { flex: 1 },
  eventRowDate: { color: '#FF9AAB', fontSize: 11, fontWeight: '800' },
  eventRowTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', marginTop: 2 },
  eventRowAge: { color: '#64748B', fontSize: 10, marginTop: 2 },
  eventRowDot: { color: '#FF5573', fontSize: 14, marginLeft: 8 },
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
