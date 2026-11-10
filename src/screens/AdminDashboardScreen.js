import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../config/supabase';
import { isEventExpired } from '../services/eventDateService';

// ─── STAT CARD ────────────────────────────────────────────────────────────────

function StatCard({ label, value, color = '#FF5573', sub }) {
  return (
    <View style={[styles.statCard, { borderColor: color + '55' }]}>
      <Text style={[styles.statValue, { color }]}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── FILA DE EVENTO ───────────────────────────────────────────────────────────

function EventRow({ item, onDelete, onToggleFeatured }) {
  const expired = isEventExpired(item.event_date, new Date());
  const dateStr = item.event_date
    ? new Intl.DateTimeFormat('es-UY', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
      }).format(new Date(item.event_date))
    : 'Sin fecha';

  return (
    <View style={[styles.eventRow, expired && styles.eventRowExpired]}>
      <View style={styles.eventRowLeft}>
        {item.is_featured ? <Text style={styles.featuredStar}>★ </Text> : null}
        <View style={{ flex: 1 }}>
          <Text style={[styles.eventRowTitle, expired && styles.eventRowTitleExpired]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.eventRowMeta}>
            {item.venue_name} · {item.city} · {dateStr}
          </Text>
          {expired ? <Text style={styles.expiredBadge}>Vencido</Text> : null}
        </View>
      </View>
      <View style={styles.eventRowActions}>
        <TouchableOpacity
          style={[styles.rowActionBtn, item.is_featured && styles.rowActionBtnActive]}
          onPress={() => onToggleFeatured(item)}
          accessibilityRole="button"
        >
          <Text style={styles.rowActionBtnText}>{item.is_featured ? '★' : '☆'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rowActionBtn, styles.rowActionBtnDelete]}
          onPress={() => onDelete(item)}
          accessibilityRole="button"
        >
          <Text style={styles.rowActionBtnText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────

export default function AdminDashboardScreen({ onBack, onCreateEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('activos'); // 'activos' | 'vencidos' | 'todos'

  const fetchAndSetEvents = useCallback(() => {
    return supabase
      .from('events')
      .select('id, title, venue_name, city, neighborhood, category, event_date, is_featured, image_url')
      .order('event_date', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        return data || [];
      });
  }, []);

  const loadEvents = useCallback(() => {
    setLoading(true);
    fetchAndSetEvents()
      .then((data) => setEvents(data))
      .catch((err) => Alert.alert('Error', err.message || 'No se pudieron cargar los eventos.'))
      .finally(() => setLoading(false));
  }, [fetchAndSetEvents]);

  useEffect(() => {
    let active = true;
    fetchAndSetEvents()
      .then((data) => {
        if (!active) return;
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setLoading(false);
        Alert.alert('Error', err.message || 'No se pudieron cargar los eventos.');
      });
    return () => { active = false; };
  }, [fetchAndSetEvents]);

  const handleDelete = (item) => {
    Alert.alert(
      '¿Borrar evento?',
      `"${item.title}" se eliminará permanentemente.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('events').delete().eq('id', item.id);
            if (error) { Alert.alert('Error', error.message); return; }
            setEvents((prev) => prev.filter((e) => e.id !== item.id));
          },
        },
      ]
    );
  };

  const handleToggleFeatured = async (item) => {
    const next = !item.is_featured;
    const { error } = await supabase
      .from('events').update({ is_featured: next }).eq('id', item.id);
    if (error) { Alert.alert('Error', error.message); return; }
    setEvents((prev) => prev.map((e) => e.id === item.id ? { ...e, is_featured: next } : e));
  };

  const now = new Date();
  const active = events.filter((e) => !isEventExpired(e.event_date, now));
  const expired = events.filter((e) => isEventExpired(e.event_date, now));
  const featured = events.filter((e) => e.is_featured);

  // Stats por ciudad
  const byCity = events.reduce((acc, e) => {
    if (!e.city) return acc;
    acc[e.city] = (acc[e.city] || 0) + 1;
    return acc;
  }, {});

  // Stats por categoría
  const byCategory = active.reduce((acc, e) => {
    if (!e.category) return acc;
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  const listData = tab === 'activos' ? active : tab === 'vencidos' ? expired : events;

  const renderHeader = () => (
    <View>
      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <StatCard label="Total eventos" value={events.length} color="#FF5573" />
        <StatCard label="Activos" value={active.length} color="#86EFAC" sub="próximos" />
        <StatCard label="Vencidos" value={expired.length} color="#94A3B8" sub="ya pasaron" />
        <StatCard label="Destacados" value={featured.length} color="#F4C95D" sub="★ featured" />
      </View>

      {/* Por ciudad */}
      {Object.keys(byCity).length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Por ciudad</Text>
          <View style={styles.tagRow}>
            {Object.entries(byCity)
              .sort((a, b) => b[1] - a[1])
              .map(([city, count]) => (
                <View key={city} style={styles.tag}>
                  <Text style={styles.tagText}>{city}</Text>
                  <Text style={styles.tagCount}>{count}</Text>
                </View>
              ))}
          </View>
        </View>
      ) : null}

      {/* Por categoría (activos) */}
      {Object.keys(byCategory).length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎵 Por categoría (activos)</Text>
          <View style={styles.tagRow}>
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, count]) => (
                <View key={cat} style={[styles.tag, styles.tagCat]}>
                  <Text style={styles.tagText}>{cat}</Text>
                  <Text style={styles.tagCount}>{count}</Text>
                </View>
              ))}
          </View>
        </View>
      ) : null}

      {/* Tabs lista */}
      <View style={styles.tabRow}>
        {[
          { key: 'activos', label: `Activos (${active.length})` },
          { key: 'vencidos', label: `Vencidos (${expired.length})` },
          { key: 'todos', label: `Todos (${events.length})` },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, tab === key && styles.tabBtnActive]}
            onPress={() => setTab(key)}
            accessibilityRole="button"
          >
            <Text style={[styles.tabBtnText, tab === key && styles.tabBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.listTitle}>
        {tab === 'activos' ? '🟢 Eventos activos' : tab === 'vencidos' ? '⚫ Eventos vencidos' : '📋 Todos los eventos'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
          <Text style={styles.backText}>‹  Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard Admin</Text>
        <TouchableOpacity onPress={onCreateEvent} style={styles.newBtn} accessibilityRole="button">
          <Text style={styles.newBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <EventRow
            item={item}
            onDelete={handleDelete}
            onToggleFeatured={handleToggleFeatured}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadEvents}
            tintColor="#FF5573"
            colors={['#FF5573']}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#FF5573" size="large" />
              <Text style={styles.loadingText}>Cargando eventos…</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No hay eventos en esta categoría.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1020' },
  listContent: { padding: 16, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomColor: '#1E2D44', borderBottomWidth: 1,
  },
  backBtn: { minWidth: 60, minHeight: 44, justifyContent: 'center' },
  backText: { color: '#FDA4B3', fontSize: 14, fontWeight: '700' },
  headerTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  newBtn: {
    minHeight: 36, justifyContent: 'center',
    backgroundColor: '#FF5573', borderRadius: 10, paddingHorizontal: 12,
  },
  newBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18,
  },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#131A2B', borderWidth: 1,
    borderRadius: 16, padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '900', lineHeight: 36 },
  statLabel: { color: '#F8FAFC', fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  statSub: { color: '#64748B', fontSize: 10, marginTop: 2 },

  // Sections
  section: { marginBottom: 18 },
  sectionTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#131A2B', borderColor: '#202B40', borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  tagCat: { borderColor: '#342849' },
  tagText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },
  tagCount: {
    color: '#FFF', fontSize: 11, fontWeight: '900',
    backgroundColor: '#FF5573', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1, overflow: 'hidden',
  },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#131A2B', borderColor: '#202B40', borderWidth: 1, borderRadius: 10,
  },
  tabBtnActive: { backgroundColor: '#FF5573', borderColor: '#FF5573' },
  tabBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  tabBtnTextActive: { color: '#FFF', fontWeight: '900' },
  listTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginBottom: 10 },

  // Event rows
  eventRow: {
    backgroundColor: '#131A2B', borderColor: '#202B40', borderWidth: 1,
    borderRadius: 14, padding: 12, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  eventRowExpired: { opacity: 0.5 },
  eventRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  featuredStar: { color: '#F4C95D', fontSize: 14, fontWeight: '900', marginTop: 1 },
  eventRowTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '800' },
  eventRowTitleExpired: { color: '#64748B' },
  eventRowMeta: { color: '#64748B', fontSize: 11, marginTop: 3 },
  expiredBadge: {
    color: '#64748B', fontSize: 9, fontWeight: '800',
    marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  eventRowActions: { flexDirection: 'row', gap: 6 },
  rowActionBtn: {
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1C2639', borderColor: '#2A3850', borderWidth: 1, borderRadius: 8,
  },
  rowActionBtnActive: { backgroundColor: '#2A2010', borderColor: '#F4C95D' },
  rowActionBtnDelete: { borderColor: '#3A1A1A' },
  rowActionBtnText: { fontSize: 14 },

  // States
  center: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { color: '#94A3B8', fontSize: 13, marginTop: 10 },
  emptyText: { color: '#64748B', fontSize: 14, fontWeight: '700' },
});
