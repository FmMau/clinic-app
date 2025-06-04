import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RecordDetail() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [doctor, setDoctor] = useState<any>(null);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || typeof id !== 'string' || !allowed) return;

      const docRef = doc(db, 'medicalRecords', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setRecord(data);

        // Cargar doctor
        if (data.doctorId) {
          const doctorSnap = await getDoc(doc(db, 'doctors', data.doctorId));
          if (doctorSnap.exists()) setDoctor(doctorSnap.data());
        }

        // Cargar paciente
        if (data.patientId) {
          const patientSnap = await getDoc(doc(db, 'patients', data.patientId));
          if (patientSnap.exists()) setPatient(patientSnap.data());
        }
      }

      setLoading(false);
    };

    fetchRecord();
  }, [id, allowed]);

  if (guardLoading || loading) return <LoadingScreen message="Cargando récord..." />;
  if (!allowed) return null;
  if (!record) return <Text style={{ padding: 20 }}>Registro no encontrado</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Section icon="person-outline" title="Información del Paciente">
        <Info label="Nombre" value={patient?.name || 'N/A'} />
        <Info label="Fecha de nacimiento" value={formatDate(patient?.birthdate) || 'N/A'} />
        <Info label="Fecha del registro" value={formatDate(record.date || record.createdAt)} />
      </Section>

      <Section icon="medkit-outline" title="Médico Responsable">
        <Info label="Nombre" value={doctor?.name || 'No especificado'} />
        <Info label="Especialidad" value={doctor?.specialty || 'General'} />
      </Section>

      <Section icon="pulse-outline" title="Diagnóstico">
        <Info label="Condición" value={record.condition || record.diagnosis || 'No especificado'} />
        <Info label="Gravedad" value={record.severity || 'No especificado'} />
      </Section>

      {record.medication && (
        <Section icon="flask-outline" title="Prescripción">
          <Info label="Medicamento" value={record.medication} />
          <Info label="Dosis" value={record.dosage || 'N/A'} />
        </Section>
      )}

      {record.notes && (
        <Section icon="chatbubble-ellipses-outline" title="Notas Adicionales">
          <Text style={styles.notes}>{record.notes}</Text>
        </Section>
      )}

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/patient/appointments/create')}
        style={styles.button}
      >
        <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.buttonText}>Agendar Seguimiento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name={icon} size={16} color="#4F46E5" style={{ marginRight: 6 }} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function formatDate(value: string | { seconds: number } | undefined) {
  try {
    if (!value) return 'N/A';
    const date =
      typeof value === 'string'
        ? new Date(value)
        : new Date(value.seconds * 1000);

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return 'Fecha desconocida';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 20,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontStyle: 'italic',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notes: {
    color: '#333',
    lineHeight: 20,
  },
  label: {
    fontWeight: '600',
    color: '#555',
    fontSize: 13,
  },
  value: {
    color: '#111',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
