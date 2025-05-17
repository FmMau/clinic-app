import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditAppointment() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [appointment, setAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newReason, setNewReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, 'appointments', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppointment({ id: docSnap.id, ...data });
        setNewDate(new Date(data.date));
        setNewReason(data.reason || '');
      }
    };

    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    if (!newDate || !newReason.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    try {
      await updateDoc(doc(db, 'appointments', String(id)), {
        date: newDate.toISOString(),
        reason: newReason,
      });

      Alert.alert('Cita actualizada');
      router.replace(`/appointments/${id}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la cita.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 24, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#5A5CFF', marginBottom: 20 }}>
        Reagendar cita
      </Text>

      {/* Fecha */}
      <Text style={{ marginBottom: 8 }}>Nueva fecha</Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={{
          backgroundColor: '#F5F5F5',
          borderRadius: 8,
          padding: 12,
          borderWidth: 1,
          borderColor: '#E0E0E0',
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Ionicons
          name="calendar-outline"
          size={20}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: newDate ? '#000' : '#999' }}>
          {newDate ? newDate.toLocaleDateString('es-MX') : 'Selecciona una fecha'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={newDate || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setNewDate(selectedDate);
          }}
        />
      )}

      {/* Motivo */}
      <Text style={{ marginBottom: 8 }}>Motivo</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F5F5F5',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#E0E0E0',
          marginBottom: 24,
          paddingHorizontal: 12,
        }}
      >
        <Ionicons name="document-text-outline" size={20} color="#5A5CFF" style={{ marginRight: 8 }} />
        <TextInput
          value={newReason}
          onChangeText={setNewReason}
          placeholder="Ej: Consulta general"
          placeholderTextColor="#999"
          style={{
            flex: 1,
            height: 48,
            color: '#000',
          }}
        />
      </View>

      {/* Botón guardar */}
      <TouchableOpacity
        onPress={handleUpdate}
        style={{
          backgroundColor: '#5A5CFF',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Ionicons
          name="checkmark-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Guardar cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
