import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CreatePayment() {
  const router = useRouter();
  const { patientId } = useLocalSearchParams();
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('Consulta médica');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDoctor = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await getDoc(doc(db, 'doctors', uid));
      if (snap.exists()) setDoctorProfile(snap.data());
    };

    fetchDoctor();
  }, []);

  const handleSubmit = async () => {
    if (!amount || !concept || !patientId) {
      Alert.alert('Error', 'Completa todos los campos obligatorios.');
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'payments'), {
        amount: parseFloat(amount),
        concept,
        patientId,
        doctorId: auth.currentUser?.uid || '',
        doctorName: doctorProfile?.name || 'Dr. Desconocido',
        specialty: doctorProfile?.specialty || '',
        location: doctorProfile?.location || '',
        status: 'pendiente',
        createdAt: serverTimestamp(),
        rating: null,
        comments: '',
      });

      Alert.alert('Éxito', 'Pago creado exitosamente.');
      router.replace('/(tabs)/doctor/payments');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Ionicons name="card-outline" size={22} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Crear Pago</Text>
      </View>

      <FormField label="ID del Paciente" value={String(patientId || '')} editable={false} />
      <FormField label="Nombre del Doctor" value={doctorProfile?.name || 'Cargando...'} editable={false} />
      <FormField label="Especialidad" value={doctorProfile?.specialty || ''} editable={false} />
      <FormField label="Ubicación" value={doctorProfile?.location || ''} editable={false} />
      <FormField label="Concepto" value={concept} onChangeText={setConcept} placeholder="Consulta médica" />
      <FormField label="Monto" value={amount} onChangeText={setAmount} placeholder="$0.00" keyboardType="decimal-pad" />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={styles.button}
      >
        <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          {loading ? 'Enviando...' : 'Enviar Pago'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  editable = true,
  placeholder,
  keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  editable?: boolean;
  placeholder?: string;
  keyboardType?: any;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        placeholder={placeholder}
        keyboardType={keyboardType}
        style={[
          styles.input,
          !editable && { backgroundColor: '#F3F4F6', color: '#888' },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  button: {
    backgroundColor: '#5A5CFF',
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
});
