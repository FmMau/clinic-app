import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type MedicalRecord = {
  id: string;
  patientId: string;
  doctorId?: string;
  diagnosis?: string;
  medications?: string;
  instructions?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number };
  [key: string]: any;
};

type Doctor = {
  name?: string;
  [key: string]: any;
};

export default function MedicalRecordsByPatient() {
  const { id } = useLocalSearchParams();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, Doctor>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const patientId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : undefined;

  const loadData = useCallback(async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, 'medicalRecords'),
        where('patientId', '==', patientId)
      );
      const snap = await getDocs(q);

      const docs: MedicalRecord[] = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...(d.data() as any),
          } as MedicalRecord)
      );

      // Ordenar por fecha (más recientes primero)
      docs.sort((a, b) => {
        const aMillis = getDateFromCreatedAt(a.createdAt)?.getTime() ?? 0;
        const bMillis = getDateFromCreatedAt(b.createdAt)?.getTime() ?? 0;
        return bMillis - aMillis;
      });

      const uniqueDoctorIds = [
        ...new Set(docs.map((d) => d.doctorId).filter(Boolean) as string[]),
      ];

      const newDoctorMap: Record<string, Doctor> = {};

      await Promise.all(
        uniqueDoctorIds.map(async (doctorId) => {
          const doctorRef = doc(db, 'doctors', doctorId);
          const doctorSnap = await getDoc(doctorRef);
          if (doctorSnap.exists()) {
            newDoctorMap[doctorId] = doctorSnap.data() as Doctor;
          }
        })
      );

      setDoctorMap(newDoctorMap);
      setRecords(docs);
    } catch (e) {
      console.error('Error cargando historial clínico', e);
      setError('Ocurrió un error al cargar el historial clínico.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!patientId) return;
    loadData();
  }, [patientId, loadData]);

  const hasRecords = records.length > 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5A5CFF" />
        <Text style={styles.centeredText}>Cargando historial...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.status}>{error}</Text>
      </View>
    );
  }

  if (!hasRecords) {
    return (
      <View style={styles.centered}>
        <Ionicons
          name="file-tray-outline"
          size={32}
          color="#9CA3AF"
          style={{ marginBottom: 8 }}
        />
        <Text style={styles.status}>Sin historial registrado para este paciente.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}
    >
      <View style={styles.header}>
        <Ionicons
          name="reader-outline"
          size={20}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.title}>Historial clínico del paciente</Text>
      </View>

      {records.map((record) => {
        const doctorData = record.doctorId
          ? doctorMap[record.doctorId]
          : undefined;
        const createdDate = getDateFromCreatedAt(record.createdAt);
        const dateLabel = createdDate
          ? createdDate.toLocaleDateString('es-MX', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : 'No disponible';

        return (
          <View key={record.id} style={styles.card}>
            <Text style={styles.label}>Diagnóstico</Text>
            <Text style={styles.text}>
              {record.diagnosis?.trim() || 'No registrado'}
            </Text>

            <Text style={styles.label}>Medicamentos</Text>
            <Text style={styles.text}>
              {record.medications?.trim() || 'No especificados'}
            </Text>

            <Text style={styles.label}>Instrucciones</Text>
            <Text style={styles.text}>
              {record.instructions?.trim() || 'No indicadas'}
            </Text>

            {doctorData && (
              <>
                <Text style={styles.label}>Doctor</Text>
                <Text style={styles.text}>
                  {doctorData.name || 'Nombre no disponible'}
                </Text>
              </>
            )}

            <Text style={styles.date}>Fecha: {dateLabel}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// Helper para soportar Timestamp o { seconds }
function getDateFromCreatedAt(
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number }
): Date | null {
  if (!createdAt) return null;
  // Firestore Timestamp
  if (createdAt instanceof Timestamp) {
    return createdAt.toDate();
  }
  if (typeof createdAt.seconds === 'number') {
    return new Date(createdAt.seconds * 1000);
  }
  return null;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  status: {
    padding: 24,
    textAlign: 'center',
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  centeredText: {
    marginTop: 12,
    color: '#555',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
    gap: 8,
  },
  label: {
    fontWeight: 'bold',
    color: '#5A5CFF',
    marginTop: 6,
  },
  text: {
    color: '#333',
  },
  date: {
    marginTop: 12,
    color: '#666',
    fontSize: 12,
  },
});
