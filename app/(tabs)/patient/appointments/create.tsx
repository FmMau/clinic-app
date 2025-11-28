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

function dateToYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}

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

  const [takenByDate, setTakenByDate] = useState<Record<string, Date[]>>({});

  // Cargar lista de doctores una sola vez
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const list = snap.docs.map((docSnap) => ({
          label: `${docSnap.data().name} - ${docSnap.data().specialty}`,
          value: docSnap.data().userId,
        }));
        setDoctorItems(list);
      } catch (err) {
        console.error('Error al obtener doctores:', err);
      }
    };
    fetchDoctors();
  }, []);

  // Genera slots de media en media hora dentro del día
  const generateTimeSlots = (date: Date): Date[] => {
    const slots: Date[] = [];
    for (let hour = START_HOUR; hour < END_HOUR; hour++) {
      for (let min = 0; min < 60; min += SLOT_DURATION_MINUTES) {
        const slot = new Date(date);
        slot.setHours(hour, min, 0, 0);
        slots.push(new Date(slot));
      }
    }
    return slots;
  };

  const precomputeAvailableDates = async (doctorUserId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endRange = new Date(today);
    endRange.setDate(today.getDate() + 30);
    endRange.setHours(23, 59, 59, 999);

    try {
      const qAppointments = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorUserId),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<=', Timestamp.fromDate(endRange))
      );

      const snap = await getDocs(qAppointments);

      const tempTakenByDate: Record<string, Date[]> = {};

      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const d: Date | undefined = data.date?.toDate?.();
        if (!d) return;
        const key = dateToYMD(d);
        if (!tempTakenByDate[key]) tempTakenByDate[key] = [];
        tempTakenByDate[key].push(d);
      });

      setTakenByDate(tempTakenByDate);

      const next30Days: string[] = [];
      const marks: any = {};

      const now = new Date();

      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = dateToYMD(date);

        // No mostrar días en el pasado (por si today tiene horas raras)
        if (date < now && dateToYMD(date) !== dateToYMD(now)) {
          marks[dateStr] = { disabled: true };
          continue;
        }

        const slots = generateTimeSlots(date);
        const takenForDay = tempTakenByDate[dateStr] || [];

        const available = slots.filter(
          (slot) =>
            !takenForDay.some(
              (t) =>
                Math.abs(t.getTime() - slot.getTime()) <
                SLOT_DURATION_MINUTES * 60 * 1000
            )
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
    } catch (err) {
      console.error('Error precomputando fechas disponibles:', err);
      setAvailableDates([]);
      setMarkedDates({});
      setTakenByDate({});
    }
  };

  // Cuando cambia el doctor, recalculamos fechas disponibles
  useEffect(() => {
    if (doctorId) {
      precomputeAvailableDates(doctorId);
    } else {
      setAvailableDates([]);
      setMarkedDates({});
      setTakenByDate({});
    }
    setSelectedDate(null);
    setSelectedSlot(null);
    setAvailableSlots([]);
  }, [doctorId]);

  const fetchAvailableSlots = (date: Date) => {
    if (!doctorId) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }

    const dateStr = dateToYMD(date);
    const slots = generateTimeSlots(date);
    const takenForDay = takenByDate[dateStr] || [];

    const available = slots.filter(
      (slot) =>
        !takenForDay.some(
          (t) =>
            Math.abs(t.getTime() - slot.getTime()) <
            SLOT_DURATION_MINUTES * 60 * 1000
        )
    );

    setAvailableSlots(available);
    setSelectedSlot(null);
  };

  // Cuando cambia la fecha seleccionada, recalcular horarios disponibles
  useEffect(() => {
    if (selectedDate && doctorId) {
      fetchAvailableSlots(selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedDate, doctorId, takenByDate]);

  if (guardLoading || !allowed) return null;

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
      const doctorSnap = await getDocs(
        query(collection(db, 'doctors'), where('userId', '==', doctorId))
      );

      const doctorData = doctorSnap.docs[0]?.data();

      if (!doctorData) {
        throw new Error('No se pudo obtener la información del doctor.');
      }

      const newAppointment = {
        patientId: uid,
        patientName,
        doctorId,
        doctor: doctorData.name || 'Médico',
        specialty: doctorData.specialty || 'General',
        location: doctorData.location || 'Ubicación no especificada',
        coordinates: doctorData.coordinates || null,
        date: Timestamp.fromDate(selectedSlot),
        reason,
        status: 'pendiente',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'appointments'), newAppointment);

      const expoPushToken = doctorData.expoPushToken;
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

      Alert.alert('Éxito', 'Cita agendada correctamente.');
      router.replace('/(tabs)/patient/appointments');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'No se pudo agendar la cita.');
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
              onDayPress={(day) => {
                const [year, month, dayNum] = day.dateString.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, dayNum));
              }}
              markedDates={{
                ...markedDates,
                ...(selectedDate && {
                  [dateToYMD(selectedDate)]: {
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
        keyExtractor={(item) => item.toISOString()}
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
