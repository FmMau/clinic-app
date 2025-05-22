import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

export default function CreateAppointment() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  if (guardLoading) return <LoadingScreen message="Cargando acceso..." />;
  if (!allowed) return null;

  const handleSubmit = async () => {
    if (!date || !reason.trim() || !doctorId) {
      Alert.alert('Error', 'Completa todos los campos, incluyendo el médico.');
      return;
    }

    const now = new Date();
    if (date < now) {
      Alert.alert('Error', 'La fecha debe ser futura.');
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
        date: date.toISOString(),
        reason,
        status: 'pendiente',
      });

      await addDoc(collection(db, 'notifications'), {
        doctorId,
        message: `Nueva cita agendada por ${patientName}`,
        type: 'info',
        read: false,
        createdAt: new Date(),
      });

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
      style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}
    >
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 24 }}>
        Agendar nueva cita
      </Text>

      {/* Fecha */}
      <Text style={{ marginBottom: 8 }}>Fecha</Text>
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
        <Text style={{ color: date ? '#000' : '#999' }}>
          {date ? date.toLocaleDateString('es-MX') : 'Selecciona una fecha'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* Motivo */}
      <Text style={{ marginBottom: 8 }}>Motivo / Tipo de consulta</Text>
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
          value={reason}
          onChangeText={setReason}
          placeholder="Ej: Consulta general"
          placeholderTextColor="#999"
          style={{
            flex: 1,
            height: 48,
            color: '#000',
          }}
        />
      </View>

      {/* Selección de doctor con DropDownPicker */}
      <Text style={{ marginBottom: 8 }}>Selecciona un médico</Text>
      <DropDownPicker
        open={open}
        value={doctorId}
        items={doctorItems}
        setOpen={setOpen}
        setValue={setDoctorId}
        setItems={setDoctorItems}
        placeholder="Selecciona un médico"
        style={{ backgroundColor: '#fff', borderColor: '#5A5CFF', marginBottom: 24 }}
        textStyle={{ color: '#000' }}
        dropDownContainerStyle={{ borderColor: '#5A5CFF' }}
      />

      {/* Botón */}
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
        }}
      >
        <Ionicons
          name="checkmark-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          {loading ? 'Agendando...' : 'Confirmar cita'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
