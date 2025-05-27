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
        method: '',
        review: '',
      });

      Alert.alert('Éxito', 'Pago creado exitosamente.');
      router.push('/(tabs)/doctor'); // Ajusta ruta si necesitas volver al dashboard del doctor
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', fontStyle: 'italic', marginBottom: 20 }}>
        Crear Pago
      </Text>

      <Text style={styles.label}>ID del Paciente</Text>
      <TextInput value={String(patientId || '')} editable={false} style={styles.input} />

      <Text style={styles.label}>Nombre del Doctor</Text>
      <TextInput
        value={doctorProfile?.name || 'Cargando...'}
        editable={false}
        style={styles.input}
      />

      <Text style={styles.label}>Especialidad</Text>
      <TextInput
        value={doctorProfile?.specialty || ''}
        editable={false}
        style={styles.input}
      />

      <Text style={styles.label}>Ubicación</Text>
      <TextInput
        value={doctorProfile?.location || ''}
        editable={false}
        style={styles.input}
      />

      <Text style={styles.label}>Concepto</Text>
      <TextInput
        value={concept}
        onChangeText={setConcept}
        placeholder="Consulta médica"
        style={styles.input}
      />

      <Text style={styles.label}>Monto</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder="$0.00"
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: '#4F46E5',
          padding: 16,
          borderRadius: 10,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 24,
        }}
      >
        <Ionicons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Enviando...' : 'Enviar Pago'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
  },
});
