import React from 'react';
import { Image } from 'expo-image';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatEventDate } from '../services/eventDateService';

export default function EventFlyerViewer({ event, onClose, onOpenTickets, onOpenMap }) {
  if (!event) return null;

  const place = [event.venue_name, event.neighborhood, event.city].filter(Boolean).join(' · ');

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cerrar flyer"
          onPress={onClose}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageScroll}
        >
          <Image
            source={{ uri: event.image_url }}
            style={styles.image}
            contentFit="contain"
            accessibilityLabel={`Flyer de ${event.title || 'evento'}`}
          />
        </ScrollView>

        <View style={styles.details}>
          <Text style={styles.date}>{formatEventDate(event.event_date)}</Text>
          <Text style={styles.title} numberOfLines={2}>{event.title || 'Evento'}</Text>
          {place ? <Text style={styles.place} numberOfLines={2}>{place}</Text> : null}
          <View style={styles.actions}>
            {onOpenTickets ? (
              <TouchableOpacity
                accessibilityRole="link"
                onPress={onOpenTickets}
                style={[styles.action, styles.primaryAction]}
              >
                <Text style={styles.actionText}>🎟  Ver entradas</Text>
              </TouchableOpacity>
            ) : null}
            {onOpenMap ? (
              <TouchableOpacity
                accessibilityRole="link"
                onPress={onOpenMap}
                style={[styles.action, styles.secondaryAction]}
              >
                <Text style={styles.actionText}>▤  Cómo llegar</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070D' },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  closeText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  imageScroll: { flexGrow: 1, justifyContent: 'center' },
  image: { width: '100%', aspectRatio: 0.8 },
  details: {
    padding: 18,
    backgroundColor: '#111A2A',
    borderTopWidth: 1,
    borderTopColor: '#243149',
  },
  date: { color: '#67E8F9', fontSize: 13, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 4 },
  place: { color: '#D5DFF0', fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryAction: { backgroundColor: '#FF5573' },
  secondaryAction: { backgroundColor: '#1E2A44', borderWidth: 1, borderColor: '#38BDF8' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
