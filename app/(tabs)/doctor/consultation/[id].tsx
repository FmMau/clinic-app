import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  Timestamp,
  updateDoc,
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

const MIN_DIAGNOSIS_LENGTH = 5;
const MAX_DIAGNOSIS_LENGTH = 2000;
const MAX_MEDICATIONS_LENGTH = 2000;
const MAX_INSTRUCTIONS_LENGTH = 2000;

export default function ConsultationDetail() {
  const params = useLocalSearchParams<{
    patientId?: string | string[];
    appointmentId?: string | string[];
  }>();

  const router = useRouter();

  const patientId = useMemo(() => {
    const value = params.patientId;
    if (Array.isArray(value)) return value[0];
    return value as string | undefined;
  }, [params.patientId]);

  const appointmentId = useMemo(() => {
    const value = params.appointmentId;
    if (Array.isArray(value)) return value[0];
    return value as string | undefined;
  }, [params.appointmentId]);

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

    if (!patient) {
      Alert.alert(
        'Error',
        'No se encontró la información del paciente. Regresa e intenta de nuevo.'
      );
      return;
    }

    const diagnosisClean = diagnosis.trim();
    const medicationsClean = medications.trim();
    const instructionsClean = instructions.trim();

    if (!diagnosisClean) {
      Alert.alert('Error', 'El diagnóstico es obligatorio.');
      return;
    }

    if (diagnosisClean.length < MIN_DIAGNOSIS_LENGTH) {
      Alert.alert(
        'Error',
        `El diagnóstico debe tener al menos ${MIN_DIAGNOSIS_LENGTH} caracteres.`
      );
      return;
    }

    if (diagnosisClean.length > MAX_DIAGNOSIS_LENGTH) {
      Alert.alert(
        'Error',
        `El diagnóstico no debe exceder los ${MAX_DIAGNOSIS_LENGTH} caracteres.`
      );
      return;
    }

    if (medicationsClean.length > MAX_MEDICATIONS_LENGTH) {
      Alert.alert(
        'Error',
        `La lista de medicamentos no debe exceder los ${MAX_MEDICATIONS_LENGTH} caracteres.`
      );
      return;
    }

    if (instructionsClean.length > MAX_INSTRUCTIONS_LENGTH) {
      Alert.alert(
        'Error',
        `Las instrucciones no deben exceder los ${MAX_INSTRUCTIONS_LENGTH} caracteres.`
      );
      return;
    }

    const record: MedicalRecordInput = {
      patientId,
      diagnosis: diagnosisClean,
      medications: medicationsClean,
      instructions: instructionsClean,
      doctorId,
      createdAt: Timestamp.now(),
    };

    try {
      setSaving(true);

      await addDoc(collection(db, 'medicalRecords'), record);

      if (appointmentId) {
        try {
          const appointmentRef = doc(db, 'appointments', appointmentId);
          await updateDoc(appointmentRef, {
            status: 'completada',
            updatedAt: Timestamp.now(),
          });
        } catch (err) {
          console.error(
            'Error actualizando estado de la cita a completada:',
            err
          );
        }
      }

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

  const fullName =
    `${patient.name || ''} ${patient.lastname || ''}`.trim() || 'Paciente';

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
          maxLength={MAX_DIAGNOSIS_LENGTH}
        />

        <Text style={styles.inputLabel}>Medicamentos</Text>
        <TextInput
          style={styles.input}
          placeholder="Lista de medicamentos"
          multiline
          value={medications}
          onChangeText={setMedications}
          maxLength={MAX_MEDICATIONS_LENGTH}
        />

        <Text style={styles.inputLabel}>Instrucciones</Text>
        <TextInput
          style={styles.input}
          placeholder="Instrucciones adicionales"
          multiline
          value={instructions}
          onChangeText={setInstructions}
          maxLength={MAX_INSTRUCTIONS_LENGTH}
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
