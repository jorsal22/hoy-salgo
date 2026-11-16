import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';
import { getHoySalgoWhatsAppUrl } from '../services/hoySalgoWhatsAppService';

const PROMOTION_MESSAGE = [
  'Hola, quiero consultar para publicar o promocionar un evento o boliche en Hoy Salgo.',
  '',
  'Tipo (fiesta eventual o boliche fijo):',
  'Nombre del evento/boliche:',
  'Fecha:',
  'Ciudad:',
  'Instagram u otra información:',
].join('\n');
const RRPP_MESSAGE = 'Hola, quiero ser RRPP de Hoy Salgo. Me gustaría recibir información para trabajar con ustedes.';

export default function PromotionWhatsAppButton({ rrppOnly = false }) {
  const openWhatsApp = async (message) => {
    const url = getHoySalgoWhatsAppUrl(message);

    try {
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'No se pudo abrir WhatsApp',
        error?.message || 'Revisá tu conexión e intentá de nuevo.'
      );
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>HOY SALGO</Text>
      <Text style={styles.title}>Contactanos por WhatsApp</Text>
      <Text style={styles.subtitle}>
        {rrppOnly ? 'Consultá cómo ser RRPP.' : 'Consultá para ser RRPP o promocionar tu evento.'}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Contactar a Hoy Salgo por WhatsApp para ser RRPP"
          onPress={() => openWhatsApp(RRPP_MESSAGE)}
          style={styles.whatsappButton}
        >
          <Text style={styles.whatsappButtonText}>SER RRPP  ›</Text>
        </TouchableOpacity>
        {!rrppOnly ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Consultar por la promoción de un evento o boliche por WhatsApp"
            onPress={() => openWhatsApp(PROMOTION_MESSAGE)}
            style={styles.promotionButton}
          >
            <Text style={styles.promotionButtonText}>PROMOCIONAR  ›</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = {
  card: {
    justifyContent: 'center',
    backgroundColor: '#123A30',
    borderColor: '#32805D',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  eyebrow: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900', marginTop: 3 },
  subtitle: { color: '#D1FAE5', fontSize: 13, lineHeight: 19, marginTop: 3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  whatsappButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  whatsappButtonText: { color: '#082F1B', fontSize: 11, fontWeight: '900' },
  promotionButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#5D9C7D',
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  promotionButtonText: { color: '#D1FAE5', fontSize: 11, fontWeight: '800' },
};
