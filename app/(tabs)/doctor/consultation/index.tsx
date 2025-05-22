import { db } from '@/lib/firebase/firebaseConfig';
import { Stack, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ConsultationSelect() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      const snap = await getDocs(collection(db, 'patients'));
      setPatients(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchPatients();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Seleccionar Paciente' }} />
      <ScrollView
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 24, paddingTop: 48, gap: 24 }}
      >
        <Text style={styles.title}>Elige un paciente</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#5A5CFF" />
        ) : (
          <View style={styles.card}>
            {patients.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.rowButton}
                onPress={() => router.push(`/(tabs)/doctor/consultation/${p.id}`)}
              >
                <Text style={styles.rowText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  rowButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#5A5CFF',
    borderRadius: 8,
  },
  rowText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});