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
      renderItem={({ item }) => {
        const isPending = item.status === 'pendiente';
        const isPaid = item.status === 'pagado';
        const isRated = !!item.rating;

        let actionText = 'Ver Detalles';
        let statusText = 'Pagado';
        let statusColor = '#27ae60';
        let iconName: keyof typeof Ionicons.glyphMap = 'checkmark-done-circle-outline';

        if (isPending) {
          actionText = 'Pagar Ahora';
          statusText = 'Pendiente';
          statusColor = '#e67e22';
          iconName = 'time-outline';
        } else if (isPaid && !isRated) {
          actionText = 'Calificar ahora';
          statusText = 'Calificar';
          statusColor = '#27ae60';
          iconName = 'star-outline';
        }

        return (
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}
          >
            {/* Título y Fecha */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="card-outline" size={18} color="#5A5CFF" style={{ marginRight: 6 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {item.concept || 'Servicio'}
                </Text>
              </View>
              <Text style={{ color: '#999', fontSize: 12 }}>
                {formatDateShort(item.date || item.createdAt)}
              </Text>
            </View>

            {/* Monto y Estado */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600' }}>${item.amount}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={iconName} size={16} color={statusColor} style={{ marginRight: 4 }} />
                <Text style={{ color: statusColor, fontSize: 14 }}>{statusText}</Text>
              </View>
            </View>

            {/* Botón */}
            <TouchableOpacity
              onPress={() => handleNavigation(item)}
              style={{
                backgroundColor: '#4F46E5',
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: 'white',
                  textAlign: 'center',
                  fontWeight: 'bold',
                }}
              >
                {actionText}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }}
    />
  );
}

function formatDateShort(value: string | { seconds: number }) {
  try {
    const date =
      typeof value === 'string'
        ? new Date(value)
        : new Date(value.seconds * 1000);

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Fecha desconocida';
  }
}
