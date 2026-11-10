import { supabase } from '../config/supabase';

const FAVORITES_MIGRATION =
  'Aplicá la migración supabase/migrations/20261103000300_create_user_favorites.sql.';

export const getFavoriteKey = (itemType, itemId) => `${itemType}:${itemId}`;

export const getFavoriteErrorMessage = (error) => {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return `Falta habilitar los favoritos en Supabase. ${FAVORITES_MIGRATION}`;
  }
  return error?.message || 'No se pudieron cargar los favoritos.';
};

export const fetchFavoriteKeys = async (userId) => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('item_type, item_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map(({ item_type, item_id }) =>
    getFavoriteKey(item_type, item_id)
  );
};

export const setFavorite = async (userId, itemType, itemId, isFavorite, itemData = {}) => {
  const query = supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', String(itemId));

  const result = isFavorite
    ? await query
    : await supabase.from('user_favorites').insert({
        user_id: userId,
        item_type: itemType,
        item_id: String(itemId),
        item_data: itemData,
      });

  if (result.error) throw result.error;
};

export const fetchFavoriteItems = async (userId) => {
  const { data: favorites, error: favoritesError } = await supabase
    .from('user_favorites')
    .select('item_type, item_id, item_data, created_at')
    .eq('user_id', userId);
  if (favoritesError) throw favoritesError;

  const eventIds = (favorites || [])
    .filter((favorite) => favorite.item_type === 'event')
    .map((favorite) => favorite.item_id);
  const clubIds = (favorites || [])
    .filter((favorite) => favorite.item_type === 'club')
    .filter((favorite) => !favorite.item_id.startsWith('event:'))
    .map((favorite) => favorite.item_id);

  const [eventsResult, clubsResult] = await Promise.all([
    eventIds.length
      ? supabase
          .from('events')
          .select('id, title, venue_name, city, event_date, image_url')
          .in('id', eventIds)
      : Promise.resolve({ data: [], error: null }),
    clubIds.length
      ? supabase
          .from('clubs')
          .select('id, name, city, neighborhood, logo_url')
          .in('id', clubIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (eventsResult.error) throw eventsResult.error;
  if (clubsResult.error) throw clubsResult.error;

  const favoriteDates = new Map(
    (favorites || []).map((favorite) => [
      getFavoriteKey(favorite.item_type, favorite.item_id),
      favorite.created_at,
    ])
  );
  const savedEventSnapshots = (favorites || [])
    .filter((favorite) => favorite.item_type === 'event')
    .filter(
      (favorite) =>
        !(eventsResult.data || []).some(
          (event) => String(event.id) === favorite.item_id
        )
    )
    .map((favorite) => ({
      ...favorite.item_data,
      id: favorite.item_id,
      itemType: 'event',
      favoriteKey: getFavoriteKey('event', favorite.item_id),
      savedAt: favorite.created_at,
    }));
  const savedClubSnapshots = (favorites || [])
    .filter(
      (favorite) =>
        favorite.item_type === 'club' && favorite.item_id.startsWith('event:')
    )
    .map((favorite) => ({
      ...favorite.item_data,
      id: favorite.item_id,
      itemType: 'club',
      favoriteKey: getFavoriteKey('club', favorite.item_id),
      savedAt: favorite.created_at,
    }));

  return [
    ...savedEventSnapshots,
    ...(eventsResult.data || []).map((event) => ({
      ...event,
      itemType: 'event',
      favoriteKey: getFavoriteKey('event', event.id),
      savedAt: favoriteDates.get(getFavoriteKey('event', event.id)),
    })),
    ...(clubsResult.data || []).map((club) => ({
      ...club,
      itemType: 'club',
      favoriteKey: getFavoriteKey('club', club.id),
      savedAt: favoriteDates.get(getFavoriteKey('club', club.id)),
    })),
    ...savedClubSnapshots,
  ].sort((first, second) =>
    String(second.savedAt || '').localeCompare(String(first.savedAt || ''))
  );
};
