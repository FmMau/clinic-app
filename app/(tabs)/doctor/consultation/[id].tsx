import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../../../lib/firebase/firebaseConfig';

type Patient = {
  name?: string;
  lastname?: string;
  [key: string]: any;
};

type MedicalRecordInput = {
  patientId: string;
  diagnosis: string;
  medications: string;
  instructions: string;
  doctorId: string;
  createdAt: Timestamp;
};

export default function ConsultationDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>(); // ID del paciente
  const router = useRouter();

  const patientId = useMemo(() => {
    const value = params.id;
    if (Array.isArray(value)) return value[0];
    return value as string | undefined;
  }, [params.id]);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [medications, setMedications] = useState('');
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'patients', patientId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setPatient(snap.data() as Patient);
        } else {
          setPatient(null);
        }
      } catch (e) {
        console.error('Error cargando paciente para consulta:', e);
        setPatient(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [patientId]);

  const handleSave = async () => {
    const doctorId = auth?.currentUser?.uid;

    if (!patientId || !doctorId) {
      Alert.alert(
        'Error',
        'Faltan datos del paciente o del doctor. Intenta volver a abrir la consulta.'
      );
      return;
    }

    if (!diagnosis.trim()) {
      Alert.alert('Error', 'El diagnóstico es obligatorio.');
      return;
    }

    const record: MedicalRecordInput = {
      patientId,
      diagnosis: diagnosis.trim(),
      medications: medications.trim(),
      instructions: instructions.trim(),
      doctorId,
      createdAt: Timestamp.now(),
    };

    try {
      setSaving(true);
      await addDoc(collection(db, 'medicalRecords'), record);
      Alert.alert('Diagnóstico guardado', 'Redirigiendo a creación de pago...', [
        {
          text: 'OK',
          onPress: () =>
            router.push(
              `/(tabs)/doctor/payments/create?patientId=${encodeURIComponent(
                patientId
              )}`
            ),
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar el diagnóstico.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5A5CFF" />
        <Text style={{ marginTop: 8, color: '#555' }}>Cargando...</Text>
      </View>
    );
  }

  if (!patientId || !patient) {
    return (
      <View style={styles.center}>
        <Text style={styles.status}>Paciente no encontrado</Text>
      </View>
    );
  }

  const fullName = `${patient.name || ''} ${patient.lastname || ''}`.trim() || 'Paciente';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 16 }}>
      {/* Header / info paciente */}
      <View style={styles.patientHeader}>
        <Ionicons
          name="person-circle-outline"
          size={36}
          color="#5A5CFF"
          style={{ marginRight: 12 }}
        />
        <View>
          <Text style={styles.patientName}>{fullName}</Text>
          <Text style={styles.patientSub}>ID: {patientId}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Ionicons
          name="document-text-outline"
          size={20}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.sectionTitle}>Registrar diagnóstico</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Diagnóstico *</Text>
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

      <TouchableOpacity
        style={[styles.button, saving && { opacity: 0.7 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          {saving ? 'Guardando...' : 'Guardar diagnóstico'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 24,
    flex: 1,
  },
  center: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    padding: 24,
    textAlign: 'center',
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  patientSub: {
    fontSize: 13,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
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
