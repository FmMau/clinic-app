import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RecordDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || typeof id !== 'string') return;

      const docRef = doc(db, 'medicalRecords', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRecord(docSnap.data());
      }

      setLoading(false);
    };

    fetchRecord();
  }, [id]);

  if (loading) return <Text style={{ padding: 20 }}>Cargando...</Text>;
  if (!record) return <Text style={{ padding: 20 }}>Registro no encontrado</Text>;

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={styles.header}>Detalle del Récord Médico</Text>

      <Section title="Información del Paciente">
        <Info label="Nombre" value={record.patientName || 'N/A'} />
        <Info label="Fecha de nacimiento" value={record.patientBirthdate || 'N/A'} />
        <Info label="Fecha del registro" value={formatDate(record.date || record.createdAt)} />
      </Section>

      <Section title="Médico Responsable">
        <Info label="Nombre" value={record.doctor || 'No especificado'} />
        <Info label="Especialidad" value={record.specialty || 'General'} />
      </Section>

      <Section title="Diagnóstico">
        <Info label="Condición" value={record.condition || 'No especificado'} />
        <Info label="Gravedad" value={record.severity || 'No especificado'} />
      </Section>

      {record.medication && (
        <Section title="Prescripción">
          <Info label="Medicamento" value={record.medication} />
          <Info label="Dosis" value={record.dosage || 'N/A'} />
        </Section>
      )}

      {record.notes && (
        <Section title="Notas Adicionales">
          <Text style={{ color: '#333', lineHeight: 20 }}>{record.notes}</Text>
        </Section>
      )}

      <TouchableOpacity
        onPress={() => router.push('/appointments/create')}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Agendar Seguimiento</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 6 }}>
      <Text style={{ fontWeight: '600', color: '#555' }}>{label}</Text>
      <Text style={{ color: '#111' }}>{value}</Text>
    </View>
  );
}

function formatDate(value: string | { seconds: number }) {
  try {
    const date = typeof value === 'string'
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
  header: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    fontStyle: 'italic' as const,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    fontStyle: 'italic' as const,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold' as const,
  },
});
