import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Image,
  StyleSheet, 
  ActivityIndicator,
  SafeAreaView,
  Dimensions 
} from 'react-native';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function ClubsListScreen({ navigation }) {
  const [clubs, setClubs] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1. Cargar Boliches
      const { data: clubsData, error: clubsError } = await supabase
        .from('clubs')
        .select('*')
        .order('name', { ascending: true });

      if (clubsError) throw clubsError;
      setClubs(clubsData || []);

      // 2. Cargar Eventos Destacados para el Carrusel (ej: tomamos los primeros 5)
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .limit(5);

      if (eventsError) throw eventsError;
      setFeaturedEvents(eventsData || []);

    } catch (err) {
      console.error('Error al cargar datos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={clubs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Título Principal de la App */}
            <View style={styles.headerContainer}>
              <Text style={styles.appTitle}>HoySalgo</Text>
              <Text style={styles.appSubtitle}>¿Dónde salimos hoy?</Text>
            </View>

            {/* Carrusel de Eventos Destacados (Monetización / Publicidad) */}
            {featuredEvents.length > 0 && (
              <View style={styles.carouselContainer}>
                <Text style={styles.sectionTitle}>🔥 Destacados de la Semana</Text>
                <FlatList
                  data={featuredEvents}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.carouselCard}
                      activeOpacity={0.9}
                      // Si querés que el banner lleve a una pantalla de detalle del evento, podés agregarlo acá
                    >
                      <Image 
                        source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7' }} 
                        style={styles.carouselImage} 
                      />
                      <View style={styles.carouselOverlay}>
                        <Text style={styles.carouselBadge}>{item.venue_name || 'Destacado'}</Text>
                        <Text style={styles.carouselTitle} numberOfLines={1}>{item.title}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <Text style={styles.sectionTitle}>Boliches & Paradores</Text>
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.clubCard}
            onPress={() => navigation.navigate('ClubDetail', { club: item })}
            activeOpacity={0.7}
          >
            <View style={styles.clubMainInfo}>
              <Text style={styles.clubName}>{item.name}</Text>
              <Text style={styles.clubLocation}>📍 {item.neighborhood}, {item.city}</Text>
              <Text style={styles.clubAddress}>{item.address}</Text>
            </View>
            <Text style={styles.arrowText}>→</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', paddingHorizontal: 16 },
  loaderContainer: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  headerContainer: { marginTop: 12, marginBottom: 16 },
  appTitle: { color: '#00e5ff', fontSize: 26, fontWeight: '900', letterSpacing: 0.5 },
  appSubtitle: { color: '#8a8a9e', fontSize: 14, marginTop: 2 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  
  /* Estilos del Carrusel */
  carouselContainer: { marginBottom: 20 },
  carouselCard: {
    width: width - 32,
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#14141f',
    borderWidth: 1,
    borderColor: '#222235',
    marginRight: 16
  },
  carouselImage: { width: '100%', height: '100%' },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(10, 10, 15, 0.85)'
  },
  carouselBadge: { color: '#00e5ff', fontSize: 10, fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase' },
  carouselTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },

  /* Estilos de las Tarjetas de Boliches */
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#14141f',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e1e2d'
  },
  clubMainInfo: { flex: 1 },
  clubName: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  clubLocation: { color: '#00e5ff', fontSize: 13, marginTop: 4 },
  clubAddress: { color: '#8a8a9e', fontSize: 12, marginTop: 2 },
  arrowText: { color: '#00e5ff', fontSize: 20, fontWeight: 'bold', marginLeft: 12 }
});