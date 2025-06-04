import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View
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
        contentContainerStyle={{ padding: 20, paddingTop: 40 }}
      >
        <Section icon="person-circle-outline" title="Elige un paciente">
          {loading ? (
            <ActivityIndicator size="large" color="#5A5CFF" />
          ) : patients.length === 0 ? (
            <Text style={{ color: '#999' }}>No hay pacientes registrados.</Text>
          ) : (
            patients.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => router.push(`/(tabs)/doctor/consultation/${p.id}`)}
              >
                <Card title={p.name} subtitle="Seleccionar para consulta" />
              </TouchableOpacity>
            ))
          )}
        </Section>
      </ScrollView>
    </>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name={icon as any} size={20} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Card({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text style={{ color: '#5A5CFF', fontWeight: 'bold', marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: '#333' }}>{subtitle}</Text>
    </View>
  );
}
