import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FavoriteButton from '../components/FavoriteButton';
import PromotionWhatsAppButton from '../components/PromotionWhatsAppButton';
import { getFavoriteErrorMessage, fetchFavoriteItems } from '../services/favoriteService';
import { formatEventDate, isEventExpired } from '../services/eventDateService';
import useCurrentTime from '../hooks/useCurrentTime';

export default function FavoritesScreen({ userId, onBack, onSignIn }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const currentTime = useCurrentTime();

  const loadFavorites = useCallback(async () => {
    try {
      const result = await fetchFavoriteItems(userId);
      setItems(result);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getFavoriteErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    Promise.resolve().then(loadFavorites);
  }, [loadFavorites]);

  const visibleItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.itemType !== 'event' ||
          !isEventExpired(item.event_date, currentTime)
      ),
    [items, currentTime]
  );

  const renderItem = ({ item }) => {
    const isEvent = item.itemType === 'event';
    const imageUrl = isEvent ? item.image_url : item.logo_url;
    const subtitle = isEvent
      ? [item.venue_name, item.city].filter(Boolean).join(' · ')
      : [item.neighborhood, item.city].filter(Boolean).join(' · ');

    return (
      <View style={styles.card}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            accessibilityLabel={`${isEvent ? 'Flyer' : 'Logo'} de ${isEvent ? item.title : item.name}`}
          />
        ) : null}
        <View style={styles.details}>
          <Text style={styles.type}>{isEvent ? 'EVENTO' : 'BOLICHE'}</Text>
          {isEvent && item.event_date ? (
            <Text style={styles.date}>{formatEventDate(item.event_date)}</Text>
          ) : null}
          <Text style={styles.title}>{isEvent ? item.title : item.name}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <FavoriteButton
          userId={userId}
          itemType={item.itemType}
          itemId={item.id}
          isFavorite
          onSignIn={onSignIn}
          onFavoriteChange={(isFavorite) => {
            if (!isFavorite) {
              setItems((current) =>
                current.filter((savedItem) => savedItem.favoriteKey !== item.favoriteKey)
              );
            }
          }}
        />
      </View>
    );
  };

  const emptyContent = loading ? (
    <View style={styles.stateCard}>
      <ActivityIndicator size="large" color="#FF5573" />
      <Text style={styles.stateMessage}>Cargando tus favoritos…</Text>
    </View>
  ) : errorMessage ? (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>No pudimos cargar tus favoritos</Text>
      <Text style={styles.stateMessage}>{errorMessage}</Text>
      <TouchableOpacity onPress={() => { setLoading(true); loadFavorites(); }} style={styles.retryButton}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.stateCard}>
      <Text style={styles.stateTitle}>
        {items.length ? 'No tenés eventos vigentes' : 'Todavía no guardaste favoritos'}
      </Text>
      <Text style={styles.stateMessage}>
        {items.length
          ? 'Los eventos dejan de aparecer cuando pasa su fecha y hora. Tus boliches favoritos siguen guardados.'
          : 'Guardá eventos y boliches con el corazón para encontrarlos acá.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={errorMessage ? [] : visibleItems}
        keyExtractor={(item) => item.favoriteKey}
        renderItem={renderItem}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onBack}
                style={styles.backButton}
              >
                <Text style={styles.backText}>‹  Inicio</Text>
              </TouchableOpacity>
              <Text style={styles.brand}>HOY SALGO</Text>
            </View>
            <PromotionWhatsAppButton />
          </View>
        }
        ListEmptyComponent={emptyContent}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => { setLoading(true); loadFavorites(); }}
            tintColor="#FF5573"
            colors={['#FF5573']}
          />
        }
        showsVerticalScrollIndicator={false}
      />
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
    marginBottom: 24,
  },
  backButton: { minHeight: 44, justifyContent: 'center', paddingRight: 12 },
  backText: { color: '#FDA4B3', fontSize: 14, fontWeight: '700' },
  brand: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131A2B',
    borderColor: '#202B40',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 64,
    height: 72,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#211B37',
  },
  details: { flex: 1 },
  type: { color: '#FF9AAB', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  date: { color: '#CBD5E1', fontSize: 11, marginTop: 4 },
  title: { color: '#F8FAFC', fontSize: 15, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#131A2B',
    borderColor: '#202B40',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
  stateTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateMessage: { color: '#94A3B8', fontSize: 13, lineHeight: 19, marginTop: 8, textAlign: 'center' },
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
