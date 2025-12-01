import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type DoctorProfile = {
  name?: string;
  specialty?: string;
  [key: string]: any;
};

type PatientInfo = {
  name?: string;
  [key: string]: any;
};

type PaymentPayload = {
  amount: number;
  concept: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  specialty?: string;
  status: 'pendiente' | 'pagado' | 'cancelado';
  createdAt: any;
  rating: number | null;
  comments: string;
};

const MAX_AMOUNT = 100000; // límite razonable para evitar errores tipo 999999999

export default function CreatePayment() {
  const router = useRouter();
  const params = useLocalSearchParams<{ patientId?: string | string[] }>();

  // Normalizar patientId en string
  const patientId = useMemo(() => {
    const value = params.patientId;
    if (Array.isArray(value)) return value[0];
    return value || '';
  }, [params.patientId]);

  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('Consulta médica');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          Alert.alert('Error', 'No se encontró sesión activa.');
          router.replace('/auth/login');
          return;
        }

        // Perfil del doctor
        const doctorSnap = await getDoc(doc(db, 'doctors', uid));
        if (doctorSnap.exists()) {
          setDoctorProfile(doctorSnap.data() as DoctorProfile);
        } else {
          setDoctorProfile(null);
        }

        // Info básica del paciente (opcional, para mostrar nombre)
        if (patientId) {
          const patientSnap = await getDoc(doc(db, 'patients', patientId));
          if (patientSnap.exists()) {
            setPatientInfo(patientSnap.data() as PatientInfo);
          } else {
            setPatientInfo(null);
          }
        }
      } catch (e) {
        console.error('Error cargando datos iniciales de pago', e);
        Alert.alert('Error', 'No se pudieron cargar los datos.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [patientId, router]);

  const parseAmount = (value: string): number | null => {
    const normalized = value.replace(',', '.').trim();

    if (!normalized) return null;

    // Solo números con opcional punto y hasta 2 decimales
    if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
      return null;
    }

    const num = Number(normalized);
    if (!Number.isFinite(num)) return null;

    return num;
  };

  const handleSubmit = async () => {
    const normalizedPatientId = (patientId || '').trim();

    if (!normalizedPatientId) {
      Alert.alert('Error', 'Falta el paciente asociado al pago.');
      return;
    }

    const conceptClean = (concept || '').trim();
    if (!conceptClean) {
      Alert.alert('Error', 'El concepto es obligatorio.');
      return;
    }
    if (conceptClean.length < 3) {
      Alert.alert(
        'Error',
        'El concepto debe tener al menos 3 caracteres.'
      );
      return;
    }
    if (conceptClean.length > 120) {
      Alert.alert(
        'Error',
        'El concepto no debe exceder 120 caracteres.'
      );
      return;
    }

    const amountNumber = parseAmount(amount);
    if (amountNumber === null) {
      Alert.alert(
        'Error',
        'Monto inválido. Usa solo números y hasta 2 decimales (ej. 500 o 500.50).'
      );
      return;
    }

    if (amountNumber <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0.');
      return;
    }

    if (amountNumber > MAX_AMOUNT) {
      Alert.alert(
        'Error',
        `El monto no puede ser mayor a ${MAX_AMOUNT.toLocaleString('es-MX')}.`
      );
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'No se encontró sesión activa.');
      return;
    }

    const doctorNameClean = (doctorProfile?.name || '').trim();
    if (!doctorProfile || !doctorNameClean) {
      Alert.alert(
        'Error',
        'Tu perfil de doctor no está completo. Agrega tu nombre antes de crear pagos.'
      );
      return;
    }

    const payload: PaymentPayload = {
      amount: amountNumber,
      concept: conceptClean,
      patientId: normalizedPatientId,
      patientName: patientInfo?.name?.trim() || undefined, // opcional
      doctorId: uid,
      doctorName: doctorNameClean,
      specialty: doctorProfile?.specialty || '',
      status: 'pendiente',
      createdAt: serverTimestamp(),
      rating: null,
      comments: '',
    };

    try {
      setLoading(true);
      await addDoc(collection(db, 'payments'), payload);
      Alert.alert('Éxito', 'Pago creado exitosamente.');
      router.replace('/(tabs)/doctor/payments');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear el pago.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>
          Cargando datos del pago...
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 24 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
      >
        <Ionicons
          name="card-outline"
          size={22}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Crear Pago</Text>
      </View>

      <FormField
        label="ID del Paciente"
        value={patientId || 'No especificado'}
        editable={false}
      />
      {patientInfo?.name && (
        <FormField
          label="Nombre del Paciente"
          value={patientInfo.name}
          editable={false}
        />
      )}
      <FormField
        label="Nombre del Doctor"
        value={doctorProfile?.name || 'Sin nombre registrado'}
        editable={false}
      />
      <FormField
        label="Especialidad"
        value={doctorProfile?.specialty || ''}
        editable={false}
      />
      <FormField
        label="Concepto"
        value={concept}
        onChangeText={setConcept}
        placeholder="Consulta médica"
      />
      <FormField
        label="Monto"
        value={amount}
        onChangeText={(text) => {
          // Permitimos escribir y normalizamos comas a puntos
          setAmount(text.replace(',', '.'));
        }}
        placeholder="500.00"
        keyboardType="decimal-pad"
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={[styles.button, loading && { opacity: 0.7 }]}
      >
        <Ionicons
          name="send"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
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
