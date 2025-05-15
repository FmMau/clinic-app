import { db } from '@/lib/firebase/firebaseConfig';
import { FontAwesome6 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AppointmentDetail() {
  const { id, edit } = useLocalSearchParams();
  const isEditMode = edit === '1';
  const router = useRouter();

  interface Appointment {
    id: string;
    date: string;
    reason?: string;
    doctor?: string;
    status?: string;
    specialty?: string;
    location?: string;
  }

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newReason, setNewReason] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const unsubscribe = onSnapshot(doc(db, 'appointments', id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppointment({
          id: docSnap.id,
          date: data.date,
          reason: data.reason,
          doctor: data.doctor,
          status: data.status,
          specialty: data.specialty,
          location: data.location,
        });

        if (isEditMode) {
          setNewDate(new Date(data.date));
          setNewReason(data.reason || '');
        }
      } else {
        setAppointment(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleUpdate = async () => {
    if (!newDate || !newReason.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos.');
      return;
    }

    try {
      if (!appointment) return;
      await updateDoc(doc(db, 'appointments', appointment.id), {
        date: newDate.toISOString(),
        reason: newReason,
      });

      Alert.alert('Cita actualizada');
      router.replace(`/appointments/${appointment.id}`);
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo actualizar la cita.');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Eliminar cita', '¿Estás seguro de eliminar esta cita permanentemente?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          if (!appointment) return;
          try {
            await deleteDoc(doc(db, 'appointments', appointment.id));
            Alert.alert('Cita eliminada');
            router.replace('/(tabs)/appointments');
          } catch (error: any) {
            Alert.alert('Error', 'No se pudo eliminar la cita.');
            console.error(error);
          }
        },
      },
    ]);
  };

  if (loading) return <Text style={{ padding: 20 }}>Cargando...</Text>;
  if (!appointment) return <Text style={{ padding: 20 }}>Cita no encontrada</Text>;

  const dateObj = new Date(appointment.date);
  const dateStr = dateObj.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView style={{ flex: 1, padding: 24, backgroundColor: '#fff' }}>
      {isEditMode ? (
        <>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>
            Reagendar cita
          </Text>

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
            }}
          >
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

          <Text style={{ marginBottom: 8 }}>Motivo</Text>
          <TextInput
            value={newReason}
            onChangeText={setNewReason}
            placeholder="Ej: Consulta general"
            placeholderTextColor="#999"
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E0E0E0',
              marginBottom: 24,
            }}
          />

          <TouchableOpacity
            onPress={handleUpdate}
            style={{
              backgroundColor: '#5A5CFF',
              paddingVertical: 14,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar cambios</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#5A5CFF', marginBottom: 16 }}>
            Detalle de Cita
          </Text>

          <View
            style={{
              backgroundColor: '#fff',
              padding: 20,
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 3,
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  backgroundColor: '#E5E7FF',
                  borderRadius: 999,
                  padding: 12,
                  marginRight: 12,
                }}
              >
                <FontAwesome6 name="user-doctor" size={24} color="#5A5CFF" />
              </View>
              <View>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>
                  Dr. {appointment.doctor || 'N/A'}
                </Text>
                <Text style={{ color: '#888' }}>{appointment.specialty || 'Cardiología'}</Text>
              </View>
            </View>

            <Text style={{ color: '#444', marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold' }}>Fecha y Hora:</Text> {dateStr} - {timeStr}
            </Text>

            <Text style={{ color: '#444', marginBottom: 12 }}>
              <Text style={{ fontWeight: 'bold' }}>Ubicación:</Text>{' '}
              {appointment.location || 'Clínica Central, Sala 203'}
            </Text>

            <View
              style={{
                height: 120,
                borderRadius: 8,
                backgroundColor: '#EEE',
                overflow: 'hidden',
              }}
            >
              <Text style={{ padding: 16, color: '#aaa', textAlign: 'center' }}>
                [Aquí iría un mapa]
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
