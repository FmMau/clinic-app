import { auth, db } from '@/lib/firebase/firebaseConfig';
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

// 🔹 Generador de ID compatible con Expo Go
const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now();

export default function ConsultationDetail() {
  const { id } = useLocalSearchParams(); // id del paciente
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
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 24 }}>
      {/* Datos del paciente */}
      <View style={styles.card}>
        <Text style={styles.label}>Nombre: <Text style={styles.value}>{patient.name}</Text></Text>
        <Text style={styles.label}>Edad: <Text style={styles.value}>{patient.age}</Text></Text>
        <Text style={styles.label}>Seguro: <Text style={styles.value}>{patient.insurance || 'N/A'}</Text></Text>
      </View>

      {/* Diagnóstico */}
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

      {/* Guardar */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  status: {
    padding: 24,
    textAlign: 'center',
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
  },
});
