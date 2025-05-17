import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/firebaseConfig';
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
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Buscar récords"
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor: '#fff',
          padding: 12,
          borderRadius: 12,
          marginBottom: 16,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      />

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
            <Text style={{ fontWeight: 'bold', fontStyle: 'italic', fontSize: 16, marginBottom: 4 }}>
              {item.title || 'Estudio clínico'}
            </Text>
            <Text style={{ color: '#555', marginBottom: 2 }}>
              {item.doctor || 'Desconocido'}
            </Text>
            <Text style={{ color: '#555', marginBottom: 8, fontSize: 12 }}>
              {formatDate(item.date || item.createdAt)}
            </Text>
            <Text numberOfLines={2} style={{ color: '#333' }}>
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
