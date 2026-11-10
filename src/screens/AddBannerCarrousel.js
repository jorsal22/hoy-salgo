
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 36;

const ADS = [
  {
    id: 'fernet',
    bg: '#0D2B0F',
    accent: '#C8A951',
    icon: 'F',
    brand: 'FERNET BRANCA',
    title: 'El clásico que nunca falla',
    subtitle: 'Fernet con Coca, el combo favorito de la noche uruguaya',
  },
  {
    id: 'corona',
    bg: '#1A3A00',
    accent: '#F5C518',
    icon: 'C',
    brand: 'CORONA EXTRA',
    title: 'Refrescate esta noche',
    subtitle: 'La cerveza perfecta para disfrutar con amigos',
  },
  {
    id: 'jameson',
    bg: '#0A2318',
    accent: '#B8860B',
    icon: 'J',
    brand: 'JAMESON WHISKEY',
    title: 'Para los que saben tomar',
    subtitle: 'Triple destilado, suave y equilibrado. El irlandés de ley',
  },
  {
    id: 'jager',
    bg: '#1A0A00',
    accent: '#FF6B00',
    icon: 'JM',
    brand: 'JAGERMEISTER',
    title: 'La noche es tuya',
    subtitle: 'El shot favorito para arrancar la noche con todo',
  },
];

function AdCard({ ad }) {
  const handlePress = async () => {
    const message = encodeURIComponent(
      `Hola! Vi la promo de ${ad.brand} en Hoy Salgo y quiero hacer un pedido.`
    );

    try {
      await Linking.openURL(`https://wa.me/59891820141?text=${message}`);
    } catch (error) {
      Alert.alert('Error', 'Intentá de nuevo.');
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Consultar promoción de ${ad.brand} por WhatsApp`}
      onPress={handlePress}
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          backgroundColor: ad.bg,
          borderColor: ad.accent,
        },
      ]}
    >
      <View style={[styles.iconCircle, { borderColor: ad.accent }]}>
        <Text style={[styles.iconText, { color: ad.accent }]}>
          {ad.icon}
        </Text>
      </View>

      <Text style={[styles.brand, { color: ad.accent }]}>
        {ad.brand}
      </Text>

      <Text style={styles.title}>{ad.title}</Text>
      <Text style={styles.subtitle}>{ad.subtitle}</Text>

      <View style={[styles.cta, { backgroundColor: ad.accent }]}>
        <Text style={styles.ctaText}>PEDIR POR WHATSAPP</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function AdBannerCarousel({ ads }) {
  const displayAds = ads?.length ? ads : ADS;
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openAdContact = async () => {
    const message = encodeURIComponent(
      'Hola! Quiero consultar sobre publicidad en la app Hoy Salgo.\n\n' +
      'Nombre de la marca:\n' +
      'Tipo de negocio:\n' +
      'Ciudad:\n' +
      'Periodo que te interesa:'
    );

    try {
      await Linking.openURL(
        `https://wa.me/59891820141?text=${message}`
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir WhatsApp. Intentá de nuevo.');
    }
  };

  useEffect(() => {
    if (displayAds.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex((previousIndex) => {
        const nextIndex = (previousIndex + 1) % displayAds.length;

        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });

        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [displayAds.length]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>PUBLICIDAD</Text>

      <FlatList
        ref={flatListRef}
        data={displayAds}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AdCard ad={item} />}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / CARD_WIDTH
          );
          setCurrentIndex(index);
        }}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
      />

      <View style={styles.dots}>
        {displayAds.map((ad, index) => (
          <View
            key={ad.id}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={openAdContact}
        style={styles.adContact}
      >
        <Text style={styles.adContactText}>
          Publicá tu marca en Hoy Salgo - Contactanos por WhatsApp
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    minHeight: 200,
    justifyContent: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 18,
    fontWeight: '900',
  },
  brand: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  cta: {
    minHeight: 38,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  ctaText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '900',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2A3850',
  },
  dotActive: {
    backgroundColor: '#FF5573',
    width: 18,
  },
  adContact: {
    marginTop: 10,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  adContactText: {
    color: '#082F1B',
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
});
