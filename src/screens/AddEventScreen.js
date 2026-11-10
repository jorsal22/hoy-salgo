import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '../config/supabase';
import { isAdminUser } from '../config/admin';
import { AGE_RANGES, CATEGORIES, CITIES } from '../constants/eventOptions';
import { normalizeInstagramUrl } from '../services/instagramService';
import { serializeEventDate } from '../services/eventDateService';

// eventToEdit: objeto completo del evento a editar
// prefill:      datos parciales del banco de datos
export default function AddEventScreen({ onBack, onCreated, prefill, eventToEdit }) {
  const isEditing = Boolean(eventToEdit);

  const parsedEditDate = isEditing && eventToEdit.event_date
    ? new Date(eventToEdit.event_date)
    : null;

  const [title, setTitle] = useState(eventToEdit?.title ?? prefill?.title ?? '');
  const [venue, setVenue] = useState(eventToEdit?.venue_name ?? prefill?.venue ?? '');
  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(eventToEdit?.club_id ?? null);
  const [usesOtherVenue, setUsesOtherVenue] = useState(
    isEditing ? !eventToEdit?.club_id : Boolean(prefill?.venue)
  );
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState('');
  const [city, setCity] = useState(eventToEdit?.city ?? prefill?.city ?? 'Montevideo');
  const [neighborhood, setNeighborhood] = useState(eventToEdit?.neighborhood ?? prefill?.neighborhood ?? '');
  const [category, setCategory] = useState(eventToEdit?.category ?? prefill?.category ?? 'Boliche');
  const [ageRange, setAgeRange] = useState(eventToEdit?.age_range ?? '+18');
  const [eventDate, setEventDate] = useState(parsedEditDate);
  const [hasSelectedDate, setHasSelectedDate] = useState(isEditing && Boolean(parsedEditDate));
  const [hasSelectedTime, setHasSelectedTime] = useState(isEditing && Boolean(parsedEditDate));
  const [existingImageUrl, setExistingImageUrl] = useState(eventToEdit?.image_url ?? null);
  const [imageAsset, setImageAsset] = useState(null);
  const [instagramUrl, setInstagramUrl] = useState(eventToEdit?.instagram_url ?? prefill?.instagram ?? '');
  const [instagramError, setInstagramError] = useState('');
  const [description, setDescription] = useState(eventToEdit?.description ?? prefill?.description ?? '');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    supabase
      .from('clubs')
      .select('id, name, city, neighborhood')
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        if (isMounted) setClubs(data || []);
      })
      .catch((error) => {
        if (isMounted) setClubsError(error.message || 'No se pudieron cargar los boliches.');
      })
      .finally(() => {
        if (isMounted) setClubsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Abrir galería del celular
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('No se pudo abrir la galería', error.message || 'Probá de nuevo.');
    }
  };

  const uploadImageToSupabase = async (asset) => {
    const targetWidth = Math.min(asset.width || 1200, 1200);
    const processedImage = await manipulateAsync(
      asset.uri,
      [{ resize: { width: targetWidth } }],
      { compress: 0.82, format: SaveFormat.JPEG }
    );
    const imageBytes = await new File(processedImage.uri).arrayBuffer();

    if (imageBytes.byteLength === 0) {
      throw new Error('La imagen quedó vacía al prepararla para subir.');
    }

    const filePath = `flyers/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const { error } = await supabase.storage
      .from('event-images')
      .upload(filePath, imageBytes, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
    if (!data?.publicUrl) {
      await supabase.storage.from('event-images').remove([filePath]);
      throw new Error('Storage no devolvió la URL pública del flyer.');
    }

    return { filePath, publicUrl: data.publicUrl };
  };

    const handleSubmit = async () => {
    if (isSubmittingRef.current) return;

    const missing = [
      !title.trim() && 'Título',
      !venue.trim() && 'Boliche/Local',
      !neighborhood.trim() && 'Barrio',
      !hasSelectedDate && 'Fecha',
      !hasSelectedTime && 'Hora',
    ].filter(Boolean);

    if (missing.length) {
      Alert.alert('Atención ⚠️', `Completá los campos obligatorios (*): ${missing.join(', ')}`);
      return;
    }
    if (!isEditing && eventDate && eventDate.getTime() <= Date.now()) {
      Alert.alert('Fecha inválida', 'Elegí una fecha y hora futuras para el evento.');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const session = sessionData?.session;
      if (!session?.user?.id) {
        Alert.alert('Iniciá sesión', 'Necesitás una cuenta para realizar esta acción.');
        return;
      }
      if (!isAdminUser(session.user)) {
        Alert.alert('Sin permisos', 'Solo un administrador puede gestionar eventos.');
        return;
      }

      const formattedIg = normalizeInstagramUrl(instagramUrl);
      if (formattedIg === null) {
        Alert.alert('Instagram inválido', 'Ingresá @usuario o un perfil de instagram.com válido.');
        return;
      }

      // Subir imagen nueva si se eligió una
      let uploadedImage = null;
      if (imageAsset) {
        uploadedImage = await uploadImageToSupabase(imageAsset);
      }

      const finalImageUrl = uploadedImage?.publicUrl ?? existingImageUrl ?? null;

      const payload = {
        title,
        club_id: selectedClubId,
        venue_name: venue,
        city,
        neighborhood,
        category,
        age_range: ageRange,
        event_date: serializeEventDate(eventDate),
        image_url: finalImageUrl,
        instagram_url: formattedIg,
        description,
      };

      let dbError;
      if (isEditing) {
        ({ error: dbError } = await supabase
          .from('events')
          .update(payload)
          .eq('id', eventToEdit.id));
      } else {
        ({ error: dbError } = await supabase.from('events').insert([{
          ...payload,
          created_by: session.user.id,
          is_featured: false,
        }]));
      }

      if (dbError) {
        if (uploadedImage?.filePath) {
          await supabase.storage.from('event-images').remove([uploadedImage.filePath]).catch(console.error);
        }
        throw dbError;
      }

      Alert.alert(
        isEditing ? '¡Guardado! ✏️' : '¡Éxito! 🎉',
        isEditing ? 'El evento fue actualizado correctamente.' : 'Evento publicado en la cartelera.'
      );
      onCreated?.();

    } catch (error) {
      const message =
        ['42703', 'PGRST204'].includes(error?.code)
          ? 'Error de migración en Supabase. Verificá las columnas de la tabla events.'
          : error?.code === '42501'
          ? 'Sin permisos. Verificá las políticas RLS en Supabase.'
          : error.message || 'No se pudo guardar el evento.';
      Alert.alert('Error', message);
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  const renderChips = (options, selected, onSelect) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScrollView}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, selected === opt && styles.chipSelected]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.chipText, selected === opt && styles.chipTextSelected]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const handleInstagramChange = (value) => {
    setInstagramUrl(value);
    setInstagramError(value.trim() && normalizeInstagramUrl(value) === null
      ? 'Ingresá @usuario o un perfil de instagram.com válido.'
      : '');
  };

  const updateEventDate = (mode, selectedDate) => {
    if (mode === 'date') setHasSelectedDate(true);
    else setHasSelectedTime(true);

    setEventDate((currentDate) => {
      const nextDate = new Date(currentDate || new Date());
      if (mode === 'date') {
        nextDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      } else {
        nextDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      }
      return nextDate;
    });
  };

  const openDatePicker = (mode) => {
    DateTimePickerAndroid.open({
      value: eventDate || new Date(),
      mode,
      is24Hour: true,
      ...(mode === 'date' ? { minimumDate: new Date() } : {}),
      onValueChange: (_event, selectedDate) => updateEventDate(mode, selectedDate),
    });
  };

  const dateLabel = eventDate && hasSelectedDate
    ? new Intl.DateTimeFormat('es-UY', { day: 'numeric', month: 'short', year: 'numeric' }).format(eventDate)
    : 'Elegir fecha';
  const timeLabel = eventDate && hasSelectedTime
    ? new Intl.DateTimeFormat('es-UY', { hour: '2-digit', minute: '2-digit', hour12: false }).format(eventDate)
    : 'Elegir hora';
  const clubsInCity = clubs.filter((club) => club.city === city);
  const showOtherVenue =
    usesOtherVenue || Boolean(clubsError) || (!clubsLoading && clubsInCity.length === 0);
  const selectCity = (nextCity) => {
    const selectedClub = clubs.find((club) => club.id === selectedClubId);
    if (selectedClub && selectedClub.city !== nextCity) {
      setSelectedClubId(null);
      setVenue('');
      setNeighborhood('');
    }
    setUsesOtherVenue(false);
    setCity(nextCity);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>‹ Volver</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>
        {isEditing ? '✏️ Editar Evento' : '➕ Nuevo Evento'}
      </Text>
      <Text style={styles.subtitle}>
        {isEditing
          ? `Editando: ${eventToEdit.title}`
          : 'Publicá las fechas de tu boliche o fiesta'}
      </Text>

      {isEditing ? (
        <View style={styles.editBanner}>
          <Text style={styles.editBannerText}>✏️ Modo edición — los cambios reemplazarán los datos actuales</Text>
        </View>
      ) : prefill ? (
        <View style={styles.prefillBanner}>
          <Text style={styles.prefillBannerText}>⚡ Datos pre-cargados desde el Banco de Datos — revisá y completá lo que falta</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Nombre del Evento *</Text>
      <TextInput style={styles.input} placeholder="Ej: Noche de Cumbia & Reggaeton" placeholderTextColor="#64748B" value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Ciudad *</Text>
      {renderChips(CITIES, city, selectCity)}

      <Text style={styles.label}>Boliche relacionado (opcional)</Text>
      <Text style={styles.clubsMessage}>
        Elegí un boliche fijo o indicá que es una fiesta eventual.
      </Text>
      {clubsLoading ? (
        <ActivityIndicator color="#F43F5E" style={styles.clubsLoading} />
      ) : clubsError ? (
        <Text style={styles.clubsMessage}>No se pudieron cargar los boliches: {clubsError}</Text>
      ) : (
        <View style={styles.clubChoices}>
          {clubsInCity.map((club) => {
            const selected = selectedClubId === club.id;
            return (
              <TouchableOpacity
                key={club.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setSelectedClubId(club.id);
                  setUsesOtherVenue(false);
                  setVenue(club.name);
                  setNeighborhood(club.neighborhood || '');
                }}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {club.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          {clubsInCity.length > 0 ? (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ selected: usesOtherVenue }}
              onPress={() => {
                setSelectedClubId(null);
                setUsesOtherVenue(true);
                setVenue('');
                setNeighborhood('');
              }}
              style={[styles.chip, usesOtherVenue && styles.chipSelected]}
            >
              <Text style={[styles.chipText, usesOtherVenue && styles.chipTextSelected]}>
                Fiesta eventual / otro local
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.clubsMessage}>
              Todavía no hay boliches registrados para {city}. El evento se guardará como fiesta eventual.
            </Text>
          )}
        </View>
      )}
      {showOtherVenue ? (
        <>
          <Text style={styles.label}>Boliche / Local *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Jackson Bar / OVO Beach"
            placeholderTextColor="#64748B"
            value={venue}
            onChangeText={setVenue}
          />
        </>
      ) : null}

      <Text style={styles.label}>Barrio / Zona *</Text>
      <TextInput style={styles.input} placeholder="Ej: Pocitos, La Barra, Península" placeholderTextColor="#64748B" value={neighborhood} onChangeText={setNeighborhood} />

      <Text style={styles.label}>Categoría / Música</Text>
      {renderChips(CATEGORIES, category, setCategory)}

      <Text style={styles.label}>Público / Edad</Text>
      {renderChips(AGE_RANGES, ageRange, setAgeRange)}

      <Text style={styles.label}>Fecha y Hora *</Text>
      {Platform.OS === 'ios' ? (
        <View style={styles.iosDateTimeFields}>
          <View style={styles.iosDateTimeField}>
            <Text style={styles.dateTimeCaption}>Fecha</Text>
            <DateTimePicker
              value={eventDate || new Date()}
              mode="date"
              display="compact"
              minimumDate={new Date()}
              themeVariant="dark"
              onValueChange={(_event, selectedDate) => updateEventDate('date', selectedDate)}
            />
          </View>
          <View style={styles.iosDateTimeField}>
            <Text style={styles.dateTimeCaption}>Hora</Text>
            <DateTimePicker
              value={eventDate || new Date()}
              mode="time"
              display="compact"
              is24Hour
              themeVariant="dark"
              onValueChange={(_event, selectedDate) => updateEventDate('time', selectedDate)}
            />
          </View>
        </View>
      ) : (
        <View style={styles.dateTimeButtons}>
          <TouchableOpacity style={styles.dateTimeButton} onPress={() => openDatePicker('date')}>
            <Text style={styles.dateTimeCaption}>Fecha</Text>
            <Text style={styles.dateTimeValue}>{dateLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateTimeButton} onPress={() => openDatePicker('time')}>
            <Text style={styles.dateTimeCaption}>Hora</Text>
            <Text style={styles.dateTimeValue}>{timeLabel}</Text>
          </TouchableOpacity>
        </View>
      )}

            <Text style={styles.label}>Flyer del Evento 🖼️</Text>

      {imageAsset ? (
        // Nueva imagen seleccionada
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>
              <Text style={styles.imageActionText}>Cambiar flyer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageActionButton} onPress={() => setImageAsset(null)}>
              <Text style={styles.removeImageText}>Quitar nueva</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : existingImageUrl ? (
        // Flyer ya cargado en Supabase (modo edición)
        <View style={styles.previewContainer}>
          <Image source={{ uri: existingImageUrl }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageActionButton} onPress={pickImage}>
              <Text style={styles.imageActionText}>Reemplazar flyer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageActionButton} onPress={() => setExistingImageUrl(null)}>
              <Text style={styles.removeImageText}>Quitar flyer</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Text style={styles.imagePickerText}>📁 Seleccionar Flyer de la Galería</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.label}>Instagram 📸</Text>
      <TextInput
        style={[styles.input, instagramError && styles.inputError]}
        placeholder="@boliche_mdeo o instagram.com/boliche_mdeo"
        placeholderTextColor="#64748B"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        value={instagramUrl}
        onChangeText={handleInstagramChange}
        accessibilityLabel="Perfil de Instagram"
      />
      {instagramError ? <Text style={styles.instagramError}>{instagramError}</Text> : null}

      <Text style={styles.label}>Descripción</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Detalles, tragos 2x1..." placeholderTextColor="#64748B" multiline numberOfLines={3} value={description} onChangeText={setDescription} />

            <TouchableOpacity
        style={[styles.submitButton, isEditing && styles.submitButtonEdit]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#FFF" />
          : <Text style={styles.submitButtonText}>{isEditing ? '✏️ Guardar Cambios' : '🚀 Publicar Evento'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  content: { padding: 20 },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 12, marginBottom: 8 },
  backButtonText: { color: '#7DD3FC', fontSize: 14, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 20 },
  label: { color: '#E2E8F0', fontSize: 14, marginBottom: 8, fontWeight: '600', marginTop: 4 },
  input: { backgroundColor: '#1E293B', color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  inputError: { borderColor: '#FB7185' },
  instagramError: { color: '#FDA4AF', fontSize: 12, marginTop: -8, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipScrollView: { marginBottom: 14, flexDirection: 'row' },
  chip: { backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  chipSelected: { backgroundColor: '#F43F5E', borderColor: '#F43F5E' },
  chipText: { color: '#94A3B8', fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: '#FFF', fontWeight: 'bold' },
  clubChoices: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  clubsLoading: { alignSelf: 'flex-start', marginVertical: 12 },
  clubsMessage: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  imagePickerButton: {
    backgroundColor: '#1E293B',
    height: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  dateTimeButtons: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  dateTimeButton: { flex: 1, minHeight: 64, justifyContent: 'center', backgroundColor: '#1E293B', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  dateTimeCaption: { color: '#94A3B8', fontSize: 12, marginBottom: 5 },
  dateTimeValue: { color: '#F8FAFC', fontSize: 15, fontWeight: '600' },
  iosDateTimeFields: { backgroundColor: '#1E293B', borderRadius: 8, padding: 12, marginBottom: 14 },
  iosDateTimeField: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  previewContainer: {
    marginBottom: 14,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 420,
    backgroundColor: '#0F172A',
  },
  imageActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    padding: 10, 
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  imageActionButton: { 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderWidth: 1, 
    borderColor: '#475569', 
    borderRadius: 6,
    backgroundColor: '#0F172A',
  },
  imageActionText: { color: '#7DD3FC', fontSize: 13, fontWeight: '600' },
  removeImageText: { color: '#FDA4AF', fontSize: 13, fontWeight: '600' },
  imagePickerText: { color: '#38BDF8', fontSize: 14, fontWeight: 'bold' },
    submitButton: { backgroundColor: '#F43F5E', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    prefillBanner: {
    backgroundColor: '#1A2D1A', borderColor: '#2A5A2A', borderWidth: 1,
    borderRadius: 10, padding: 10, marginBottom: 16,
  },
  prefillBannerText: { color: '#86EFAC', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  editBanner: {
    backgroundColor: '#1A1F3A', borderColor: '#3B4EAF', borderWidth: 1,
    borderRadius: 10, padding: 10, marginBottom: 16,
  },
  editBannerText: { color: '#93C5FD', fontSize: 12, fontWeight: '700', lineHeight: 17 },
  submitButtonEdit: { backgroundColor: '#3B82F6' },
});