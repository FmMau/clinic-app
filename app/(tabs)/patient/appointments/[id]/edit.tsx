import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DropDownPicker from 'react-native-dropdown-picker';

const START_HOUR = 9;
const END_HOUR = 17;
const SLOT_DURATION_MINUTES = 30;

export default function EditAppointment() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [appointment, setAppointment] = useState<any>(null);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newReason, setNewReason] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [doctorId, setDoctorId] = useState('');
  const [doctorItems, setDoctorItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      const snap = await getDocs(collection(db, 'doctors'));
      const list = snap.docs.map(doc => ({
        label: `${doc.data().name} - ${doc.data().specialty}`,
        value: doc.data().userId,
      }));
      setDoctorItems(list);
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !allowed) return;

    const fetchData = async () => {
      const docSnap = await getDoc(doc(db, 'appointments', id));
      if (docSnap.exists()) {
        const data = docSnap.data();
        const dateObj = data.date?.toDate?.() ?? new Date();
        setAppointment({ id: docSnap.id, ...data });
        setNewDate(dateObj);
        setSelectedSlot(dateObj);
        setNewReason(data.reason || '');
        setDoctorId(data.doctorId);
      }
    };
    fetchData();
  }, [id, allowed]);

  useEffect(() => {
    if (newDate && doctorId) {
      fetchAvailableSlots(newDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [newDate, doctorId]);

  if (guardLoading) return <LoadingScreen message="Cargando cita..." />;
  if (!allowed) return null;
  if (!appointment) return <Text style={{ padding: 24 }}>Cita no encontrada</Text>;

  const generateTimeSlots = (date: Date): Date[] => {
    const slots: Date[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      for (let min = 0; min < 60; min += SLOT_DURATION_MINUTES) {
        const slot = new Date(date);
        slot.setHours(hour);
        slot.setMinutes(min);
        slot.setSeconds(0);
        slot.setMilliseconds(0);
        slots.push(new Date(slot));
      }
    }
    return slots;
  };

  const fetchAvailableSlots = async (date: Date) => {
    const slots = generateTimeSlots(date);
    const start = new Date(date);
    start.setHours(START_HOUR, 0, 0, 0);
    const end = new Date(date);
    end.setHours(END_HOUR, 0, 0, 0);

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('date', '>=', Timestamp.fromDate(start)),
      where('date', '<=', Timestamp.fromDate(end))
    );

    const snap = await getDocs(q);
    const taken = snap.docs
      .filter(doc => doc.id !== id) // excluir la actual cita
      .map(doc => doc.data().date.toDate());

    const available = slots.filter(slot =>
      !taken.some(t => Math.abs(t.getTime() - slot.getTime()) < 30 * 60 * 1000)
    );

    setAvailableSlots(available);
  };

  const handleUpdate = async () => {
    if (!selectedSlot || !newReason.trim() || !doctorId) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }

    const now = new Date();
    if (selectedSlot.getTime() <= now.getTime()) {
      Alert.alert('Error', 'La fecha y hora deben ser futuras.');
      return;
    }

    try {
      const appointmentRef = doc(db, 'appointments', String(id));
      const doctorSnap = await getDocs(
        query(collection(db, 'doctors'), where('userId', '==', doctorId))
      );
      const doctorData = doctorSnap.docs[0]?.data();

      await updateDoc(appointmentRef, {
        doctorId,
        doctor: doctorData.name,
        specialty: doctorData.specialty,
        location: doctorData.location,
        coordinates: doctorData.coordinates || null,
        date: Timestamp.fromDate(selectedSlot),
        reason: newReason.trim(),
        updatedAt: Timestamp.now(),
      });

      Alert.alert('Cita actualizada.');
      router.replace(`/(tabs)/patient/appointments/${id}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo actualizar la cita.');
    }
  };

  return (
    <FlatList
      contentContainerStyle={{ padding: 24, backgroundColor: '#fff' }}
      ListHeaderComponent={
        <>
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>
            Editar cita
          </Text>

          <Text style={{ marginBottom: 8 }}>Selecciona un médico</Text>
          <DropDownPicker
            open={open}
            value={doctorId}
            items={doctorItems}
            setOpen={setOpen}
            setValue={setDoctorId}
            setItems={setDoctorItems}
            placeholder="Selecciona un médico"
            style={{ marginBottom: 24, borderColor: '#5A5CFF' }}
            dropDownContainerStyle={{ borderColor: '#5A5CFF' }}
          />

          <Text style={{ marginBottom: 8 }}>Selecciona una nueva fecha</Text>
          <Calendar
            onDayPress={day => {
              const [year, month, dayNum] = day.dateString.split('-').map(Number);
              setNewDate(new Date(year, month - 1, dayNum));
            }}
            markedDates={{
              ...(newDate && {
                [newDate.toISOString().split('T')[0]]: {
                  selected: true,
                  selectedColor: '#5A5CFF',
                },
              }),
            }}
            disableAllTouchEventsForDisabledDays
            style={{ marginBottom: 24 }}
          />
        </>
      }
      data={availableSlots}
      keyExtractor={item => item.toISOString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => setSelectedSlot(item)}
          style={{
            padding: 12,
            borderWidth: 1,
            borderColor:
              selectedSlot?.getTime() === item.getTime() ? '#5A5CFF' : '#ccc',
            borderRadius: 8,
            marginBottom: 8,
            backgroundColor:
              selectedSlot?.getTime() === item.getTime() ? '#E8E9FF' : '#fff',
          }}
        >
          <Text style={{ textAlign: 'center' }}>
            {item.toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
      )}
      ListFooterComponent={
        <>
          <Text style={{ marginTop: 16, marginBottom: 8 }}>
            Motivo / Tipo de consulta
          </Text>
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
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#5A5CFF"
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={newReason}
              onChangeText={setNewReason}
              placeholder="Ej: Consulta general"
              placeholderTextColor="#999"
              style={{ flex: 1, height: 48, color: '#000' }}
            />
          </View>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#A0A3FF' : '#5A5CFF',
              padding: 14,
              borderRadius: 8,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 48,
            }}
          >
            <Ionicons
              name="checkmark-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? 'Actualizando...' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </>
      }
    />
  );
}
