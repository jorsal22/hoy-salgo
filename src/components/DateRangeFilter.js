import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { formatEventDay, getLocalDateKey } from '../services/eventDateService';

const dateFromKey = (dateKey) => {
  if (!dateKey) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export default function DateRangeFilter({ fromDate, toDate, onChange }) {
  const [activePicker, setActivePicker] = useState(null);
  const today = dateFromKey(getLocalDateKey());
  const from = dateFromKey(fromDate);
  const to = dateFromKey(toDate);

  const updateDate = (type, selectedDate) => {
    const dateKey = getLocalDateKey(selectedDate);
    if (type === 'from') {
      onChange(dateKey, toDate && dateKey > toDate ? dateKey : toDate);
    } else {
      onChange(fromDate && dateKey < fromDate ? dateKey : fromDate, dateKey);
    }
  };

  const openPicker = (type) => {
    if (Platform.OS !== 'android') {
      setActivePicker(type);
      return;
    }

    DateTimePickerAndroid.open({
      value: type === 'from' ? from || to || today : to || from || today,
      mode: 'date',
      minimumDate: type === 'to' && from ? from : today,
      maximumDate: type === 'from' ? to || undefined : undefined,
      onValueChange: (_event, selectedDate) => updateDate(type, selectedDate),
    });
  };

  const activePickerDate =
    activePicker === 'from' ? from || to || today : to || from || today;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>RANGO DE FECHAS</Text>
      <View style={styles.dateButtons}>
        {[
          { type: 'from', label: 'Desde', date: from },
          { type: 'to', label: 'Hasta', date: to },
        ].map(({ type, label, date }) => (
          <TouchableOpacity
            key={type}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${date ? formatEventDay(type === 'from' ? fromDate : toDate) : 'elegir fecha'}`}
            onPress={() => openPicker(type)}
            style={styles.dateButton}
          >
            <Text style={styles.dateCaption}>{label}</Text>
            <Text style={styles.dateValue}>
              {date ? formatEventDay(type === 'from' ? fromDate : toDate) : 'Elegir fecha'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {fromDate || toDate ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => onChange('', '')}
          style={styles.clearButton}
        >
          <Text style={styles.clearText}>Limpiar rango</Text>
        </TouchableOpacity>
      ) : null}
      {Platform.OS !== 'android' && activePicker ? (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={activePickerDate}
            mode="date"
            minimumDate={activePicker === 'to' && from ? from : today}
            maximumDate={activePicker === 'from' ? to || undefined : undefined}
            onValueChange={(_event, selectedDate) => updateDate(activePicker, selectedDate)}
            onDismiss={() => setActivePicker(null)}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setActivePicker(null)}
            style={styles.doneButton}
          >
            <Text style={styles.doneText}>Listo</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
    paddingHorizontal: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  dateButtons: { flexDirection: 'row', gap: 8 },
  dateButton: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: '#1C2639',
    borderColor: '#2A3850',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dateCaption: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  dateValue: { color: '#F8FAFC', fontSize: 12, fontWeight: '700', marginTop: 2 },
  clearButton: { alignSelf: 'flex-end', minHeight: 36, justifyContent: 'center', paddingHorizontal: 4 },
  clearText: { color: '#FF9AAB', fontSize: 11, fontWeight: '700' },
  pickerContainer: {
    backgroundColor: '#1C2639',
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
  },
  doneButton: { alignSelf: 'flex-end', minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 },
  doneText: { color: '#FF9AAB', fontSize: 13, fontWeight: '800' },
});
