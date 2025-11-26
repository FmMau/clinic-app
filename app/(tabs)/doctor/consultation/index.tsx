import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Patient = {
  id: string;
  name?: string;
  email?: string;
  [key: string]: any;
};

export default function ConsultationSelect() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchPatients = useCallback(async () => {
    try {
      setError(null);
      const snap = await getDocs(collection(db, 'patients'));
      const data: Patient[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as any),
      }));

      // Ordenar por nombre
      data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setPatients(data);
    } catch (e) {
      console.error('Error cargando pacientes para consulta:', e);
      setError('Ocurrió un error al cargar los pacientes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((p) => {
      const name = p.name?.toLowerCase() || '';
      const email = p.email?.toLowerCase() || '';
      return name.includes(term) || email.includes(term);
    });
  }, [patients, search]);

  return (
    <>
      <Stack.Screen options={{ title: 'Seleccionar Paciente' }} />
      <ScrollView
        style={{ backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 20, paddingTop: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5A5CFF']}
          />
        }
      >
        <Section icon="person-circle-outline" title="Elige un paciente">
          {/* Buscador */}
          <View style={styles.searchBox}>
            <Ionicons
              name="search-outline"
              size={18}
              color="#9CA3AF"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={{ flex: 1, fontSize: 14 }}
              placeholder="Buscar por nombre o correo..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#5A5CFF" />
          ) : error ? (
            <Text style={{ color: '#B00020' }}>{error}</Text>
          ) : filteredPatients.length === 0 ? (
            <Text style={{ color: '#999' }}>
              {patients.length === 0
                ? 'No hay pacientes registrados.'
                : 'No se encontraron pacientes con ese criterio.'}
            </Text>
          ) : (
            filteredPatients.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/doctor/consultation/[id]',
                    params: { id: p.id },
                  })
                }
              >
                <Card
                  title={p.name || 'Paciente sin nombre'}
                  subtitle={p.email || 'Seleccionar para consulta'}
                />
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Card({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.card}>
      <Text style={{ color: '#5A5CFF', fontWeight: 'bold', marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ color: '#333' }}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});
