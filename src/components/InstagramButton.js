import React from 'react';
import { Alert, Linking, Text, TouchableOpacity } from 'react-native';
import { normalizeInstagramUrl } from '../services/instagramService';

export default function InstagramButton({ value, label = 'Instagram' }) {
  const instagramUrl = normalizeInstagramUrl(value);
  if (!instagramUrl) return null;

    const openInstagram = async () => {
    try {
      // Extraer username de la URL normalizada
      const username = instagramUrl.replace('https://www.instagram.com/', '').replace('/', '');
      const appUrl = `instagram://user?username=${username}`;
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(instagramUrl);
      }
    } catch (error) {
      try {
        await Linking.openURL(instagramUrl);
      } catch {
        Alert.alert(
          'No se pudo abrir Instagram',
          'Revisá tu conexión e intentá de nuevo.'
        );
      }
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={`Ver Instagram de ${label}`}
      onPress={openInstagram}
      style={styles.button}
    >
      <Text style={styles.buttonText}>◎  Ver Instagram</Text>
    </TouchableOpacity>
  );
}

const styles = {
  button: {
    alignSelf: 'flex-start',
    minHeight: 34,
    justifyContent: 'center',
    backgroundColor: '#30213C',
    borderColor: '#49304E',
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 12,
    marginTop: 9,
  },
  buttonText: { color: '#FF9AAB', fontSize: 11, fontWeight: '800' },
};
