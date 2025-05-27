import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/firebaseConfig';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';

export default function DoctorPaymentsIndex() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayments(data);
      setFiltered(data);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(payments);
    } else {
      const s = search.toLowerCase();
      setFiltered(
        payments.filter((p) =>
          p.patientName?.toLowerCase().includes(s)
        )
      );
    }
  }, [search, payments]);

  const formatDate = (value: any) => {
    if (!value) return '';
    const date = new Date(value?.seconds * 1000);
    return date.toLocaleDateString('es-MX');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>
        Pagos Pasados
      </Text>

      <TextInput
        placeholder="Buscar paciente..."
        value={search}
        onChangeText={setSearch}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          borderRadius: 10,
          padding: 10,
          marginBottom: 20,
        }}
      />

      {filtered.map((item) => (
        <View
          key={item.id}
          style={{
            backgroundColor: '#fff',
            padding: 16,
            borderRadius: 12,
            marginBottom: 12,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
            {item.patientName || 'Paciente desconocido'}
          </Text>
          <Text style={{ color: '#555', marginBottom: 4 }}>{item.concept}</Text>
          <Text style={{ color: '#999', marginBottom: 8 }}>
            Fecha: {formatDate(item.createdAt)}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>${item.amount}</Text>
        </View>
      ))}

      <Text style={{ fontSize: 18, fontWeight: 'bold', fontStyle: 'italic', marginVertical: 16 }}>
        Valoraciones/Comentarios
      </Text>

      {payments
        .filter((p) => p.rating && p.comments)
        .map((p) => (
          <View
            key={p.id + '-review'}
            style={{
              backgroundColor: '#fff',
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text style={{ fontStyle: 'italic', marginBottom: 8 }}>
              "{p.comments}"
            </Text>
            <Text style={{ textAlign: 'right', color: '#4F46E5' }}>
              – {p.patientName || 'Paciente'}
            </Text>
          </View>
        ))}
    </ScrollView>
  );
}
