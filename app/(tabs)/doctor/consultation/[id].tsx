import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
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

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now();

export default function ConsultationDetail() {
  const { id } = useLocalSearchParams(); // ID del paciente
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id || typeof id !== 'string') return;

      const ref = doc(db, 'patients', id);
      const snap = await getDoc(ref);
      if (snap.exists()) setPatient(snap.data());
      setLoading(false);
    };

    fetchPatient();
  }, [id]);

  const handleSave = async () => {
    const doctorId = auth.currentUser?.uid;

    if (!id || !diagnosis.trim() || !doctorId) {
      Alert.alert('Error', 'Faltan datos del paciente, diagnóstico o doctor.');
      return;
    }

    const record = {
      patientId: id,
      diagnosis: diagnosis.trim(),
      medications: medications.trim(),
      instructions: instructions.trim(),
      doctorId,
      createdAt: Timestamp.now(),
    };

    try {
      await setDoc(doc(db, 'medicalRecords', generateId()), record);
      Alert.alert('Diagnóstico guardado', 'Redirigiendo a creación de pago...');
      router.push(`/(tabs)/doctor/payments/create?patientId=${id}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar el diagnóstico.');
    }
  };

  if (loading) return <Text style={styles.status}>Cargando...</Text>;
  if (!patient) return <Text style={styles.status}>Paciente no encontrado</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 0 }}>
      <View style={styles.sectionHeader}>
        <Ionicons name="document-text-outline" size={20} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={styles.sectionTitle}>Registrar diagnóstico</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Diagnóstico</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe el diagnóstico"
          multiline
          value={diagnosis}
          onChangeText={setDiagnosis}
        />

        <Text style={styles.inputLabel}>Medicamentos</Text>
        <TextInput
          style={styles.input}
          placeholder="Lista de medicamentos"
          multiline
          value={medications}
          onChangeText={setMedications}
        />

        <Text style={styles.inputLabel}>Instrucciones</Text>
        <TextInput
          style={styles.input}
          placeholder="Instrucciones adicionales"
          multiline
          value={instructions}
          onChangeText={setInstructions}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar diagnóstico</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 24,
  },
  status: {
    padding: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  label: {
    fontWeight: 'bold',
  },
  value: {
    fontWeight: 'normal',
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#5A5CFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
});
