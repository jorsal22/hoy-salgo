import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';

const WHATSAPP_NUMBER = '59891820141';
const PROMOTION_MESSAGE = [
  'Hola, quiero consultar para publicar o promocionar un evento o boliche en Hoy Salgo.',
  '',
  'Tipo (fiesta eventual o boliche fijo):',
  'Nombre del evento/boliche:',
  'Fecha:',
  'Ciudad:',
  'Instagram u otra información:',
].join('\n');

export default function PromotionWhatsAppButton() {
  const openWhatsApp = async () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(PROMOTION_MESSAGE)}`;

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
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Promocioná tu evento o boliche por WhatsApp"
      onPress={openWhatsApp}
      style={styles.button}
    >
      <Text style={styles.eyebrow}>¿QUERÉS SUMAR UN EVENTO O BOLICHE?</Text>
      <Text style={styles.title}>Hablá con nosotros</Text>
      <Text style={styles.subtitle}>Publicaciones y promociones, directo por WhatsApp.</Text>
      <View style={styles.whatsappButton}>
        <Text style={styles.whatsappButtonText}>ESCRIBIR POR WHATSAPP  ›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = {
  button: {
    minHeight: 126,
    justifyContent: 'center',
    backgroundColor: '#123A30',
    borderColor: '#32805D',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    marginBottom: 16,
  },
  eyebrow: {
    color: '#A7F3D0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  title: { color: '#FFF', fontSize: 21, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#D1FAE5', fontSize: 13, marginTop: 3 },
  whatsappButton: {
    minHeight: 38,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 13,
    marginTop: 11,
  },
  whatsappButtonText: { color: '#082F1B', fontSize: 11, fontWeight: '900' },
};
