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

export default function DoctorDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      const ref = collection(db, 'patients');
      const snap = await getDocs(ref);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPatients(data);
      setLoading(false);
    };

    fetchPatients();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Dashboard Médico' }} />
      <ScrollView
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 24, paddingTop: 48, gap: 24 }}
      >
        <Text style={styles.title}>Pacientes</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#5A5CFF" />
        ) : (
          <View style={styles.card}>
            {patients.map((p) => (
              <View
                key={p.id}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <View>
                  <Text style={{ fontWeight: 'bold' }}>{p.name || 'Sin nombre'}</Text>
                  <Text style={{ color: '#555' }}>{p.email || 'Sin correo'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`../consultation/${p.id}`)}
                  style={styles.button}
                >
                  <Text style={{ color: '#fff' }}>Diagnóstico</Text>
                </TouchableOpacity>
              </View>
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
  },
  button: {
    backgroundColor: '#5A5CFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});
