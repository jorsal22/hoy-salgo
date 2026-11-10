import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import * as Linking from 'expo-linking';

const normalizeWhatsAppNumber = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('598')) {
    return /^598[2-9]\d{6,7}$/.test(digits) ? digits : null;
  }

  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!/^[2-9]\d{6,7}$/.test(digits)) return null;
  return `598${digits}`;
};

export default function ClubWhatsAppButton({ clubName, phone }) {
  if (!phone) return null;

  const whatsappNumber = normalizeWhatsAppNumber(phone);
  if (!whatsappNumber) {
    return (
      <Text style={styles.invalidPhone}>
        Teléfono: {phone} · No disponible por WhatsApp
      </Text>
    );
  }

  const openWhatsApp = async () => {
    const message = `Hola, vi a ${clubName} en Hoy Salgo y quiero hacer una consulta.`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
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
    <View style={styles.container}>
      <Text style={styles.phone}>{phone}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Consultar a ${clubName} por WhatsApp`}
        onPress={openWhatsApp}
        style={styles.button}
      >
        <Text style={styles.buttonText}>WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 7 },
  phone: { color: '#CBD5E1', fontSize: 12, marginRight: 9 },
  invalidPhone: { color: '#94A3B8', fontSize: 11, marginTop: 7 },
  button: {
    minHeight: 34,
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 13,
  },
  buttonText: { color: '#082F1B', fontSize: 11, fontWeight: '900' },
};
