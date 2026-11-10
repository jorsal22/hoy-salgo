import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Linking, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { supabase } from '../lib/supabase'; // Ajustá la ruta a tu cliente de Supabase

export default function ClubDetailScreen({ route, navigation }) {
  const { club } = route.params;
  const [clubEvents, setClubEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClubEvents();
  }, [club]);

  const fetchClubEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('venue_name', club.name)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setClubEvents(data || []);
    } catch (err) {
      console.error('Error al cargar eventos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openInstagram = () => {
    if (club.instagram_url) {
      Linking.openURL(club.instagram_url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Botón Volver */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Volver</Text>
      </TouchableOpacity>

      {/* Info del Boliche */}
      <View style={styles.headerCard}>
        <Text style={styles.clubTitle}>{club.name}</Text>
        <Text style={styles.clubLocation}>📍 {club.neighborhood}, {club.city}</Text>
        <Text style={styles.clubAddress}>{club.address}</Text>

        {club.instagram_url && (
          <TouchableOpacity style={styles.instaButton} onPress={openInstagram}>
            <Text style={styles.instaButtonText}>Ver en Instagram 📸</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Próximos Eventos */}
      <Text style={styles.sectionTitle}>Próximos eventos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00e5ff" style={{ marginTop: 20 }} />
      ) : clubEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay eventos agendados por ahora.</Text>
        </View>
      ) : (
        <FlatList
          data={clubEvents}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.eventCard}>
              <Image 
                source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7' }} 
                style={styles.eventImage} 
              />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.eventDate}>
                  📅 {new Date(item.event_date).toLocaleDateString('es-UY', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} hs
                </Text>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badge}>{item.category}</Text>
                  <Text style={styles.badgeAge}>{item.age_range}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 16 },
  backButton: { marginVertical: 12 },
  backButtonText: { color: '#00e5ff', fontSize: 16, fontWeight: '600' },
  headerCard: { 
    backgroundColor: '#14141f', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#222230' 
  },
  clubTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  clubLocation: { color: '#00e5ff', fontSize: 14, marginTop: 4, fontWeight: '500' },
  clubAddress: { color: '#8a8a9e', fontSize: 13, marginTop: 2 },
  instaButton: { 
    marginTop: 14, 
    backgroundColor: '#E1306C', 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 8, 
    alignSelf: 'flex-start' 
  },
  instaButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  emptyContainer: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#66667a', fontStyle: 'italic' },
  eventCard: { 
    flexDirection: 'row', 
    backgroundColor: '#14141f', 
    borderRadius: 12, 
    marginBottom: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e1e2d'
  },
  eventImage: { width: 100, height: 100 },
  eventInfo: { padding: 12, flex: 1, justifyContent: 'center' },
  eventTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  eventDate: { color: '#00e5ff', fontSize: 12, marginTop: 4 },
  badgeContainer: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: { backgroundColor: '#222235', color: '#aaa', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeAge: { backgroundColor: '#ff005522', color: '#ff4081', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' }
});