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
        }

        // Info básica del paciente (opcional, para mostrar nombre)
        if (patientId) {
          const patientSnap = await getDoc(doc(db, 'patients', patientId));
          if (patientSnap.exists()) {
            setPatientInfo(patientSnap.data() as PatientInfo);
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

  const validateAmount = (value: string) => {
    // Permitir vacío mientras se escribe
    if (!value.trim()) return true;
    // Número positivo, hasta 2 decimales
    return /^\d+(\.\d{1,2})?$/.test(value);
  };

  const handleSubmit = async () => {
    if (!patientId) {
      Alert.alert('Error', 'Falta el paciente asociado al pago.');
      return;
    }

    if (!amount || !concept) {
      Alert.alert('Error', 'Completa todos los campos obligatorios.');
      return;
    }

    if (!validateAmount(amount)) {
      Alert.alert(
        'Error',
        'Monto inválido. Usa solo números y hasta 2 decimales (ej. 500 o 500.50).'
      );
      return;
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      Alert.alert('Error', 'El monto debe ser mayor a 0.');
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert('Error', 'No se encontró sesión activa.');
      return;
    }

    const doctorName = doctorProfile?.name || 'Dr. Desconocido';

    const payload: PaymentPayload = {
      amount: amountNumber,
      concept: concept.trim(),
      patientId,
      patientName: patientInfo?.name || undefined, // opcional
      doctorId: uid,
      doctorName,
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
        value={doctorProfile?.name || 'Cargando...'}
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
          // Permitimos escribir y validamos al guardar
          setAmount(text.replace(',', '.')); // por si el usuario pone coma
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
