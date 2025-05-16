import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function PaymentDetail() {
  const { id } = useLocalSearchParams();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const docRef = doc(db, 'payments', id);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPayment(docSnap.data());
        } else {
          setPayment(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error al obtener detalle del pago en tiempo real:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  if (loading) return <Text style={{ padding: 20 }}>Cargando...</Text>;
  if (!payment) return <Text style={{ padding: 20 }}>Pago no encontrado</Text>;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        Detalle del pago
      </Text>

      <Text style={{ marginBottom: 8 }}>💳 Concepto: {payment.concept}</Text>
      <Text style={{ marginBottom: 8 }}>💰 Monto: ${payment.amount}</Text>
      <Text style={{ marginBottom: 8 }}>
        🗓️ Fecha: {formatDate(payment.date || payment.createdAt)}
      </Text>
      <Text style={{ marginBottom: 8 }}>
        🧾 Método: {payment.method || 'No especificado'}
      </Text>
      <Text style={{ marginBottom: 8 }}>
        📌 Estado: {payment.status || 'pagado'}
      </Text>
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Fecha desconocida';
  }
}
