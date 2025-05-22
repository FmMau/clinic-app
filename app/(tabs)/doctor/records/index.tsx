import { db } from '@/lib/firebase/firebaseConfig';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';

export default function MedicalRecordsIndex() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPatients = async () => {
      const snap = await getDocs(collection(db, 'patients'));
      setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchPatients();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 48 }} size="large" color="#5A5CFF" />;

  if (patients.length === 0)
    return <Text style={styles.status}>No hay pacientes con historiales aún.</Text>;

  return (
    <ScrollView style={{ backgroundColor: '#fff' }} contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text style={styles.title}>Historiales por paciente</Text>
      {patients.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => router.push(`/(tabs)/doctor/records/${p.id}`)}
          style={styles.card}
        >
          <Text style={{ fontWeight: 'bold' }}>{p.name}</Text>
          <Text style={{ color: '#666' }}>{p.email || 'Sin correo'}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});
