import LoadingScreen from '@/components/ui/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MedicalRecordsIndex() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente', 'doctor']);
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [doctorMap, setDoctorMap] = useState<Record<string, any>>({});

  // 🔹 Obtener doctores
  useEffect(() => {
    const fetchDoctors = async () => {
      const snap = await getDocs(collection(db, 'doctors'));
      const map: Record<string, any> = {};
      snap.forEach((doc) => {
        map[doc.id] = doc.data();
      });
      setDoctorMap(map);
    };

    fetchDoctors();
  }, []);

  // 🔹 Obtener récords del paciente
  useEffect(() => {
    if (!user?.uid || !allowed) return;

    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecords(data);
      setFiltered(data);
    });

    return () => unsubscribe();
  }, [user, allowed]);

  // 🔹 Filtro de búsqueda
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(records);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        records.filter((r) =>
          r.title?.toLowerCase().includes(lower) ||
          r.result?.toLowerCase().includes(lower) ||
          r.notes?.toLowerCase().includes(lower) ||
          doctorMap[r.doctorId]?.name?.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, records, doctorMap]);

  const handlePress = (id: string) => {
    router.push(`/(tabs)/patient/records/${id}`);
  };

  if (guardLoading || Object.keys(doctorMap).length === 0) {
    return <LoadingScreen message="Cargando historial clínico..." />;
  }

  if (!allowed) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#f9f9f9', padding: 16 }}>
      {/* Buscador */}
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          marginBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Ionicons name="search-outline" size={20} color="#999" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Buscar diagnóstico o doctor"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, padding: 0 }}
        />
      </View>

      {/* Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 48 }}>
            No hay récords registrados.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item.id)}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
              ...Platform.select({
                ios: { shadowOffset: { width: 0, height: 2 } },
              }),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="medkit-outline" size={18} color="#5A5CFF" style={{ marginRight: 6 }} />
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                {item.title || item.diagnosis || 'Estudio clínico'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="person-circle-outline" size={14} color="#999" style={{ marginRight: 4 }} />
              <Text style={{ color: '#555', fontSize: 13 }}>
                {doctorMap[item.doctorId]?.name || 'Nombre del doctor no disponible'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="calendar-outline" size={12} color="#999" style={{ marginRight: 4 }} />
              <Text style={{ color: '#555', fontSize: 12 }}>
                {formatDate(item.createdAt)}
              </Text>
            </View>

            {(item.result || item.notes) && (
              <Text numberOfLines={2} style={{ color: '#333', fontSize: 13 }}>
                {item.result || item.notes}
              </Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function formatDate(value: string | { seconds: number }) {
  try {
    const date = typeof value === 'string'
      ? new Date(value)
      : new Date(value.seconds * 1000);

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return 'Fecha desconocida';
  }
}
