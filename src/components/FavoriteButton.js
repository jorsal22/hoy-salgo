import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { setFavorite } from '../services/favoriteService';

export default function FavoriteButton({
  userId,
  itemType,
  itemId,
  itemData,
  isFavorite,
  onFavoriteChange,
  onSignIn,
}) {
  const [saving, setSaving] = useState(false);

  const toggleFavorite = async () => {
    if (!userId) {
      Alert.alert(
        'Iniciá sesión para guardar',
        'Podés seguir viendo todos los eventos y boliches sin cuenta. Iniciá sesión para guardar tus favoritos.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: onSignIn },
        ]
      );
      return;
    }

    if (saving) return;
    setSaving(true);
    try {
      const nextValue = !isFavorite;
      await setFavorite(userId, itemType, itemId, isFavorite, itemData);
      onFavoriteChange?.(nextValue);
    } catch (error) {
      Alert.alert('No se pudo guardar', error?.message || 'Probá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'
      }
      accessibilityState={{ selected: isFavorite, disabled: saving }}
      disabled={saving}
      onPress={toggleFavorite}
      style={{
        minWidth: 42,
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: saving ? 0.6 : 1,
      }}
    >
      <Text style={{ color: '#FF9AAB', fontSize: 24 }}>
        {isFavorite ? '♥' : '♡'}
      </Text>
    </TouchableOpacity>
  );
}
