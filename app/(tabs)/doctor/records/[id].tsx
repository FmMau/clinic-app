import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MedicalRecordsByPatient() {
  const { id } = useLocalSearchParams();
  const [records, setRecords] = useState<any[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchData = async () => {
      const q = query(collection(db, 'medicalRecords'), where('patientId', '==', id));
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

      const uniqueDoctorIds = [...new Set(docs.map(d => d.doctorId).filter(Boolean))];
      const map: Record<string, any> = {};

      for (const docId of uniqueDoctorIds) {
        const doctorSnap = await getDoc(doc(db, 'doctors', docId));
        if (doctorSnap.exists()) map[docId] = doctorSnap.data();
      }

      setDoctorMap(map);
      setRecords(docs);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <Text style={styles.status}>Cargando historial...</Text>;
  if (records.length === 0) return <Text style={styles.status}>Sin historial registrado</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}>
      <View style={styles.header}>
        <Ionicons name="reader-outline" size={20} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Historial clínico del paciente</Text>
      </View>

      {records.map(record => (
        <View key={record.id} style={styles.card}>
          <Text style={styles.label}>Diagnóstico</Text>
          <Text style={styles.text}>{record.diagnosis || 'No registrado'}</Text>

          <Text style={styles.label}>Medicamentos</Text>
          <Text style={styles.text}>{record.medications || 'No especificados'}</Text>

          <Text style={styles.label}>Instrucciones</Text>
          <Text style={styles.text}>{record.instructions || 'No indicadas'}</Text>

          {record.doctorId && doctorMap[record.doctorId] && (
            <>
              <Text style={styles.label}>Doctor</Text>
              <Text style={styles.text}>{doctorMap[record.doctorId].name}</Text>
            </>
          )}

          <Text style={styles.date}>
            Fecha:{' '}
            {record.createdAt?.seconds
              ? new Date(record.createdAt.seconds * 1000).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : 'No disponible'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
