import LoadingScreen from '@/components/ui/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const PAGE_SIZE = 10;

export default function MedicalRecordsIndex() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente', 'doctor']);
  const router = useRouter();
  const { user } = useAuth();

  const [records, setRecords] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [doctorMap, setDoctorMap] = useState<Record<string, any>>({});

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const uid = user?.uid;

  // 🔹 Obtener doctores una sola vez
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const map: Record<string, any> = {};
        snap.forEach((docSnap) => {
          map[docSnap.id] = docSnap.data();
        });
        setDoctorMap(map);
      } catch (err) {
        console.error('Error obteniendo doctores:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, []);

  // 🔹 Obtener récords del paciente con paginación
  const fetchRecords = async (reset = false) => {
    if (!uid || !allowed) {
      setLoadingRecords(false);
      return;
    }

    if (reset) {
      setLoadingRecords(true);
      setHasMore(true);
      setLastVisible(null);
      setRecords([]);
      setFiltered([]);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    try {
      const baseCollection = collection(db, 'medicalRecords');

      let q: any = query(
        baseCollection,
        where('patientId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!reset && lastVisible) {
        q = query(
          baseCollection,
          where('patientId', '==', uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);

      const fetched = snapshot.docs.map((docSnap) => {
        const data = (docSnap.data() ?? {}) as Record<string, any>;
        return {
          id: docSnap.id,
          ...data,
        };
      });

      setRecords((prev) => (reset ? fetched : [...prev, ...fetched]));
      setFiltered((prev) => (reset ? fetched : [...prev, ...fetched]));

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error obteniendo historial clínico:', err);
      setHasMore(false);
    } finally {
      setLoadingRecords(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!uid || !allowed) {
      setLoadingRecords(false);
      return;
    }
    fetchRecords(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, allowed]);

  // 🔹 Filtro de búsqueda (sobre los cargados)
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(records);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        records.filter((r) => {
          const doctorName = doctorMap[r.doctorId]?.name?.toLowerCase() || '';
          return (
            r.title?.toLowerCase().includes(lower) ||
            r.result?.toLowerCase().includes(lower) ||
            r.notes?.toLowerCase().includes(lower) ||
            doctorName.includes(lower)
          );
        })
      );
    }
  }, [search, records, doctorMap]);

  const handlePress = (id: string) => {
    router.push(`/(tabs)/patient/records/${id}`);
  };

  if (guardLoading || loadingDoctors || loadingRecords) {
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
              <Ionicons
                name="person-circle-outline"
                size={14}
                color="#999"
                style={{ marginRight: 4 }}
              />
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
        ListFooterComponent={
          hasMore ? (
            <View style={{ marginTop: 8, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => fetchRecords(false)}
                disabled={loadingMore}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: '#5A5CFF',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {loadingMore && (
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function formatDate(value: string | { seconds: number }) {
  try {
    const date =
      typeof value === 'string'
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
