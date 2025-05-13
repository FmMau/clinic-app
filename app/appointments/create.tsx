import { auth, db } from '@/lib/firebase/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity
} from 'react-native';

export default function CreateAppointment() {
  const router = useRouter();
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !reason.trim()) {
      Alert.alert('Error', 'Por favor selecciona una fecha y escribe el motivo.');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'Sesión no válida.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'appointments'), {
        patientId: uid,
        date: date.toISOString(),
        reason,
        status: 'pendiente',
      });
      Alert.alert('Éxito', 'Cita agendada correctamente.');
      router.replace('/(tabs)/patient');
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
        }}
      >
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

      <Text style={{ marginBottom: 8 }}>Motivo / Tipo de consulta</Text>
      <TextInput
        value={reason}
        onChangeText={setReason}
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
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#A0A3FF' : '#5A5CFF',
          padding: 14,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
          {loading ? 'Agendando...' : 'Confirmar cita'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
