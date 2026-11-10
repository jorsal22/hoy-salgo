import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../config/supabase';
import { isAdminUser } from '../config/admin';
import { CITIES } from '../constants/eventOptions';
import { normalizeInstagramUrl } from '../services/instagramService';
import { getClubLogoStoragePath } from '../services/clubLogoService';

const getSaveErrorMessage = (error) => {
  if (['42P01', 'PGRST205'].includes(error?.code)) {
    return 'Falta crear la tabla de boliches en Supabase. Ejecutá la migración supabase/migrations/20261103000000_create_clubs.sql.';
  }
  if (['42703', 'PGRST204'].includes(error?.code)) {
    return 'La tabla de boliches está desactualizada. Volvé a ejecutar la migración supabase/migrations/20261103000000_create_clubs.sql.';
  }
  if (error?.code === '23505') {
    return 'Ya existe un boliche con ese nombre en esa ciudad.';
  }
  if (error?.code === '42501') {
    return 'Supabase rechazó el permiso. La sesión debe ser salsamendi.jorge@gmail.com y la política SQL debe estar actualizada.';
  }
  return error?.message || 'Revisá la conexión e intentá de nuevo.';
};

export default function AddClubScreen({ club, onBack, onCreated }) {
  const isEditing = Boolean(club?.id);
  const [name, setName] = useState(club?.name || '');
  const [city, setCity] = useState(club?.city || CITIES[0]);
  const [neighborhood, setNeighborhood] = useState(club?.neighborhood || '');
  const [address, setAddress] = useState(club?.address || '');
  const [phone, setPhone] = useState(club?.phone || '');
  const [instagram, setInstagram] = useState(club?.instagramUrl || '');
  const [removeExistingLogo, setRemoveExistingLogo] = useState(false);
  const [logoAsset, setLogoAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const existingLogoUrl = !removeExistingLogo ? club?.logoUrl : null;

  const pickLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]) {
        setLogoAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('No se pudo abrir la galería', error.message || 'Probá de nuevo.');
    }
  };

  const uploadLogo = async (asset) => {
    let processedImage;
    try {
      processedImage = await manipulateAsync(
        asset.uri,
        [{ resize: { width: Math.min(asset.width || 800, 800) } }],
        { compress: 0.82, format: SaveFormat.JPEG }
      );
    } catch (error) {
      throw new Error(`No se pudo preparar la imagen: ${error.message || 'error desconocido'}`);
    }

    let imageBytes;
    try {
      imageBytes = await new File(processedImage.uri).arrayBuffer();
    } catch (error) {
      throw new Error(`No se pudo leer la imagen elegida: ${error.message || 'error desconocido'}`);
    }
    if (imageBytes.byteLength === 0) {
      throw new Error('La imagen quedó vacía al prepararla para subir.');
    }

    const filePath = `flyers/${Date.now()}-${Math.random().toString(36).slice(2)}-club-logo.jpg`;
    const { error } = await supabase.storage
      .from('event-images')
      .upload(filePath, imageBytes, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });
    if (error) {
      throw new Error(
        `No se pudo subir el logo a Supabase Storage (${error.statusCode || error.code || 'sin código'}): ${error.message || 'error desconocido'}`
      );
    }

    const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
    if (!data?.publicUrl) {
      const { error: cleanupError } = await supabase.storage
        .from('event-images')
        .remove([filePath]);
      if (cleanupError) {
        console.error('No se pudo limpiar el logo después de fallar la publicación:', cleanupError);
      }
      throw new Error('Storage no devolvió la URL pública del logo.');
    }

    return { filePath, publicUrl: data.publicUrl };
  };

  const handleCreateClub = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresá el nombre del boliche.');
      return;
    }

    const instagramUrl = normalizeInstagramUrl(instagram);
    if (instagramUrl === null) {
      Alert.alert(
        'Instagram inválido',
        'Ingresá @usuario o un perfil de instagram.com válido.'
      );
      return;
    }

    setLoading(true);
    let uploadedLogoPath = null;
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;
      if (!user?.id) {
        throw new Error('Necesitás iniciar sesión para agregar un boliche.');
      }
      if (!isAdminUser(user)) {
        throw new Error(
          `La cuenta ${user.email || 'activa'} no tiene permisos de administrador.`
        );
      }

      const uploadedLogo = logoAsset ? await uploadLogo(logoAsset) : null;
      uploadedLogoPath = uploadedLogo?.filePath || null;
      const clubValues = {
        name: name.trim(),
        city,
        neighborhood: neighborhood.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
        logo_url: uploadedLogo?.publicUrl || existingLogoUrl || null,
        instagram_url: instagramUrl || null,
      };
      const { error, data } = isEditing
        ? await supabase
            .from('clubs')
            .update(clubValues)
            .eq('id', club.id)
            .select('id')
            .maybeSingle()
        : await supabase
            .from('clubs')
            .insert({ ...clubValues, created_by: user.id })
            .select('id')
            .maybeSingle();
      if (error) {
        throw error;
      }
      if (!data?.id) {
        throw new Error('Supabase no confirmó el guardado del boliche.');
      }

      let cleanupWarning = '';
      const oldLogoPath = getClubLogoStoragePath(club?.logoUrl);
      if (oldLogoPath && oldLogoPath !== uploadedLogoPath && (uploadedLogo || removeExistingLogo)) {
        const { error: cleanupError } = await supabase.storage
          .from('event-images')
          .remove([oldLogoPath]);
        if (cleanupError) {
          console.error('No se pudo limpiar el logo anterior del boliche:', cleanupError);
          cleanupWarning = ' Los datos se guardaron, pero no se pudo borrar el logo anterior de Storage.';
        }
      }

      uploadedLogoPath = null;
      Alert.alert(
        '¡Listo!',
        `${isEditing ? 'Los datos del boliche se actualizaron.' : 'El boliche ya aparece en la lista fija.'}${cleanupWarning}`
      );
      onCreated?.();
    } catch (error) {
      if (uploadedLogoPath) {
        const { error: cleanupError } = await supabase.storage
          .from('event-images')
          .remove([uploadedLogoPath]);
        if (cleanupError) {
          console.error('No se pudo limpiar el logo después de fallar la publicación:', cleanupError);
        }
      }
      Alert.alert(
        'No se pudo agregar el boliche',
        getSaveErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onBack}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹  Volver a boliches</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{isEditing ? 'Modificar boliche' : 'Agregar boliche'}</Text>
        <Text style={styles.subtitle}>
          {isEditing
            ? 'Actualizá la información y la imagen del boliche.'
            : 'Va a quedar en la lista aunque todavía no tenga eventos publicados.'}
        </Text>

        <Text style={styles.label}>Imagen o logo</Text>
        {logoAsset || existingLogoUrl ? (
          <View style={styles.logoPreviewContainer}>
            <Image
              source={{ uri: logoAsset?.uri || existingLogoUrl }}
              style={styles.logoPreview}
            />
            <View style={styles.logoActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={async () => {
                  setRemoveExistingLogo(false);
                  await pickLogo();
                }}
                style={styles.logoActionButton}
              >
                <Text style={styles.logoActionText}>Cambiar imagen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  setLogoAsset(null);
                  setRemoveExistingLogo(Boolean(club?.logoUrl));
                }}
                style={styles.logoActionButton}
              >
                <Text style={styles.logoRemoveText}>
                  Quitar imagen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={pickLogo}
            style={styles.logoPickerButton}
          >
            <Text style={styles.logoPickerIcon}>♫</Text>
            <Text style={styles.logoPickerText}>Elegir logo desde la galería</Text>
            <Text style={styles.logoPickerHint}>Opcional · formato cuadrado recomendado</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.label}>Nombre del boliche *</Text>
        <TextInput
          accessibilityLabel="Nombre del boliche"
          autoCapitalize="words"
          maxLength={100}
          onChangeText={setName}
          placeholder="Ej: Jackson Bar"
          placeholderTextColor="#64748B"
          style={styles.input}
          value={name}
        />

        <Text style={styles.label}>Ciudad *</Text>
        <View style={styles.cityList}>
          {CITIES.map((option) => {
            const selected = city === option;
            return (
              <TouchableOpacity
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setCity(option)}
                style={[styles.cityChip, selected && styles.cityChipSelected]}
              >
                <Text style={[styles.cityText, selected && styles.cityTextSelected]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Barrio o zona</Text>
        <TextInput
          accessibilityLabel="Barrio o zona"
          autoCapitalize="words"
          maxLength={100}
          onChangeText={setNeighborhood}
          placeholder="Ej: Pocitos"
          placeholderTextColor="#64748B"
          style={styles.input}
          value={neighborhood}
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          accessibilityLabel="Dirección del boliche"
          autoCapitalize="words"
          maxLength={150}
          onChangeText={setAddress}
          placeholder="Calle y número"
          placeholderTextColor="#64748B"
          style={styles.input}
          value={address}
        />

        <Text style={styles.label}>Teléfono o WhatsApp</Text>
        <TextInput
          accessibilityLabel="Teléfono o WhatsApp del boliche"
          keyboardType="phone-pad"
          maxLength={30}
          onChangeText={setPhone}
          placeholder="+598..."
          placeholderTextColor="#64748B"
          style={styles.input}
          value={phone}
        />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          accessibilityLabel="Instagram del boliche"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={200}
          onChangeText={setInstagram}
          placeholder="@usuario"
          placeholderTextColor="#64748B"
          style={styles.input}
          value={instagram}
        />

        <TouchableOpacity
          accessibilityRole="button"
          disabled={loading}
          onPress={handleCreateClub}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
          <Text style={styles.submitButtonText}>
            {isEditing ? 'Guardar cambios' : 'Guardar boliche'}
          </Text>
        )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020' },
  content: { padding: 20, paddingBottom: 36 },
  backButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: '#FDA4B3', fontSize: 14, fontWeight: '700' },
  title: { color: '#F8FAFC', fontSize: 25, fontWeight: '900', marginTop: 16 },
  subtitle: { color: '#94A3B8', fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 24 },
  label: { color: '#E2E8F0', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  logoPickerButton: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#131A2B',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
  },
  logoPickerIcon: { color: '#FF9AAB', fontSize: 30, fontWeight: '800' },
  logoPickerText: { color: '#F8FAFC', fontSize: 13, fontWeight: '700', marginTop: 8 },
  logoPickerHint: { color: '#94A3B8', fontSize: 11, marginTop: 5 },
  logoPreviewContainer: {
    backgroundColor: '#131A2B',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  logoPreview: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#0B1020',
  },
  logoActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 },
  logoActionButton: { minHeight: 38, justifyContent: 'center', paddingHorizontal: 10 },
  logoActionText: { color: '#FF9AAB', fontSize: 12, fontWeight: '700' },
  logoRemoveText: { color: '#FDA4AF', fontSize: 12, fontWeight: '700' },
  input: {
    minHeight: 48,
    backgroundColor: '#131A2B',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 13,
    color: '#FFF',
    fontSize: 15,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  cityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  cityChip: {
    minHeight: 38,
    justifyContent: 'center',
    backgroundColor: '#1C2639',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 13,
  },
  cityChipSelected: { backgroundColor: '#FF5573', borderColor: '#FF5573' },
  cityText: { color: '#CFD6E4', fontSize: 12, fontWeight: '600' },
  cityTextSelected: { color: '#FFF', fontWeight: '800' },
  submitButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5573',
    borderRadius: 15,
    marginTop: 12,
  },
  submitButtonDisabled: { opacity: 0.65 },
  submitButtonText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
});
