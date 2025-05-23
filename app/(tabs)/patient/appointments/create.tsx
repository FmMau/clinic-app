import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import DropDownPicker from 'react-native-dropdown-picker';

const START_HOUR = 9;
const END_HOUR = 17;
const SLOT_DURATION_MINUTES = 30;

export default function CreateAppointment() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const router = useRouter();

  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [doctorItems, setDoctorItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

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
    if (doctorId) {
      precomputeAvailableDates();
    } else {
      setAvailableDates([]);
      setMarkedDates({});
    }
    setSelectedDate(null);
    setSelectedSlot(null);
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate && doctorId) {
      fetchAvailableSlots(selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDate]);

  if (guardLoading || !allowed) return null;

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

  const precomputeAvailableDates = async () => {
    const today = new Date();
    const next30Days: string[] = [];

    const marks: any = {};

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

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
      const taken = snap.docs.map(doc => doc.data().date.toDate());

      const available = slots.filter(slot =>
        !taken.some(t => Math.abs(t.getTime() - slot.getTime()) < 30 * 60 * 1000)
      );

      if (available.length > 0) {
        next30Days.push(dateStr);
        marks[dateStr] = { marked: true, dotColor: '#5A5CFF' };
      } else {
        marks[dateStr] = { disabled: true };
      }
    }

    setAvailableDates(next30Days);
    setMarkedDates(marks);
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
    const taken = snap.docs.map(doc => doc.data().date.toDate());

    const available = slots.filter(slot =>
      !taken.some(t => Math.abs(t.getTime() - slot.getTime()) < 30 * 60 * 1000)
    );

    setAvailableSlots(available);
  };

  const sendPushNotification = async (
    expoPushToken: string,
    title: string,
    body: string
  ) => {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: 'default',
        title,
        body,
      }),
    });
  };

  const handleSubmit = async () => {
    if (!selectedSlot || !reason.trim() || !doctorId) {
      Alert.alert('Error', 'Completa todos los campos, incluyendo fecha y horario.');
      return;
    }

    const now = new Date();
    if (selectedSlot.getTime() <= now.getTime()) {
      Alert.alert('Error', 'La fecha y hora deben ser futuras.');
      return;
    }

    const uid = auth.currentUser?.uid;
    const patientName = auth.currentUser?.displayName || 'Paciente';

    if (!uid) {
      Alert.alert('Error', 'Sesión no válida.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        patientId: uid,
        doctorId,
        patientName,
        date: Timestamp.fromDate(selectedSlot),
        reason,
        status: 'pendiente',
      });

      const doctorSnap = await getDocs(
        query(collection(db, 'doctors'), where('userId', '==', doctorId))
      );
      const doctorData = doctorSnap.docs[0]?.data();
      const expoPushToken = doctorData?.expoPushToken;

      if (expoPushToken) {
        const hora = selectedSlot.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const fecha = selectedSlot.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        await sendPushNotification(
          expoPushToken,
          'Nueva cita agendada',
          `Consulta de ${patientName} para el ${fecha} a las ${hora}`
        );
      }

      Alert.alert('Éxito', 'Cita agendada y notificación enviada.');
      router.replace('/(tabs)/patient/appointments');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <FlatList
        contentContainerStyle={{ padding: 24 }}
        ListHeaderComponent={
          <>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>
              Agendar nueva cita
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

            <Text style={{ marginBottom: 8 }}>Selecciona una fecha</Text>
            <Calendar
              onDayPress={day => {
                const [year, month, dayNum] = day.dateString.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, dayNum));
              }}
              markedDates={{
                ...markedDates,
                ...(selectedDate && {
                  [selectedDate.toISOString().split('T')[0]]: {
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
                value={reason}
                onChangeText={setReason}
                placeholder="Ej: Consulta general"
                placeholderTextColor="#999"
                style={{ flex: 1, height: 48, color: '#000' }}
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
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
              <Text
                style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}
              >
                {loading ? 'Agendando...' : 'Confirmar cita'}
              </Text>
            </TouchableOpacity>
          </>
        }
      />
    </KeyboardAvoidingView>
  );
}
