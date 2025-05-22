import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function MedicalRecordsByPatient() {
  const { id } = useLocalSearchParams(); // id del paciente
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchRecords = async () => {
      const q = query(collection(db, 'medicalRecords'), where('patientId', '==', id));
      const snap = await getDocs(q);
      setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchRecords();
  }, [id]);

  if (loading) return <Text style={styles.status}>Cargando historial...</Text>;
  if (records.length === 0) return <Text style={styles.status}>Sin historial registrado</Text>;

  return (
    <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, gap: 16 }}>
      {records.map(record => (
        <View key={record.id} style={styles.card}>
          <Text style={styles.label}>Diagnóstico:</Text>
          <Text>{record.diagnosis}</Text>
          <Text style={styles.label}>Medicamentos:</Text>
          <Text>{record.medications}</Text>
          <Text style={styles.label}>Instrucciones:</Text>
          <Text>{record.instructions}</Text>
          <Text style={styles.date}>
            Fecha:{' '}
            {record.createdAt?.seconds
              ? new Date(record.createdAt.seconds * 1000).toLocaleDateString()
              : 'No disponible'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  status: {
    padding: 24,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  label: {
    fontWeight: 'bold',
  },
  date: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
});
