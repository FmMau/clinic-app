import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MedicalRecordsIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'medicalRecords'),
      where('patientId', '==', user.uid),
      orderBy('date', 'desc')
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
  }, [user]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(records);
    } else {
      const lower = search.toLowerCase();
      setFiltered(
        records.filter(
          (r) =>
            r.title?.toLowerCase().includes(lower) ||
            r.result?.toLowerCase().includes(lower) ||
            r.doctor?.toLowerCase().includes(lower)
        )
      );
    }
  }, [search, records]);

  const handlePress = (id: string) => {
    router.push(`/records/${id}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f7f7f7', padding: 16 }}>
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
          placeholder="Buscar récords"
          value={search}
          onChangeText={setSearch}
          style={{ flex: 1, padding: 0 }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item.id)}
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="medkit-outline" size={18} color="#5A5CFF" style={{ marginRight: 6 }} />
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                {item.title || 'Estudio clínico'}
              </Text>
            </View>

            <Text style={{ color: '#555', marginBottom: 2 }}>
              <Ionicons name="person-circle-outline" size={14} color="#999" />{' '}
              {item.doctor || 'Desconocido'}
            </Text>
            <Text style={{ color: '#555', marginBottom: 8, fontSize: 12 }}>
              <Ionicons name="calendar-outline" size={12} color="#999" />{' '}
              {formatDate(item.date || item.createdAt)}
            </Text>

            <Text numberOfLines={2} style={{ color: '#333', fontSize: 13 }}>
              {item.result || item.notes || 'Sin detalles disponibles...'}
            </Text>
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
