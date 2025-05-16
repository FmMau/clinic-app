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
    ActivityIndicator,
    FlatList,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PaymentsIndex() {
  const router = useRouter();
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('patientId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPayments(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error al obtener pagos en tiempo real:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Cargando pagos...</Text>
      </View>
    );
  }

  if (!payments.length) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 16 }}>No hay pagos registrados aún.</Text>
      </View>
    );
  }

  const handleNavigation = (item: any) => {
    if (item.status === 'pendiente') {
      router.push(`/payments/${item.id}/pay`);
    } else if (!item.rating) {
      router.push(`/payments/${item.id}/review`);
    } else {
      router.push(`/payments/${item.id}`);
    }
  };

  return (
    <FlatList
      data={payments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => handleNavigation(item)}
          style={{
            padding: 16,
            marginBottom: 12,
            backgroundColor: '#fff',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
            {item.concept || 'Pago'}
          </Text>

          <Text style={{ marginBottom: 4 }}>
            💰 <Text style={{ fontWeight: 'bold' }}>${item.amount}</Text>
          </Text>

          <Text style={{ marginBottom: 4 }}>
            🗓️ {formatDate(item.date || item.createdAt)}
          </Text>

          <Text style={{ marginBottom: 4 }}>
            🧾 Método: {item.method || 'No especificado'}
          </Text>

          <Text
            style={{
              color: item.status === 'pendiente' ? '#e67e22' : '#27ae60',
            }}
          >
            📌 Estado: {item.status || 'pagado'}
          </Text>

          {item.status === 'pendiente' && (
            <Text
              style={{ marginTop: 6, color: '#4F46E5', fontWeight: 'bold' }}
            >
              👉 Toca para pagar
            </Text>
          )}

          {item.status === 'pagado' && !item.rating && (
            <Text
              style={{ marginTop: 6, color: '#f39c12', fontWeight: 'bold' }}
            >
              ⭐ Califica este servicio
            </Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

function formatDate(value: string | { seconds: number }) {
  try {
    const date =
      typeof value === 'string'
        ? new Date(value)
        : new Date(value.seconds * 1000);

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Fecha desconocida';
  }
}
