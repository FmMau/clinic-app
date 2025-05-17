import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

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

  const subtotal = payment.amount || 0;
  const discount = payment.discount || 0;
  const total = subtotal - discount;

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', fontStyle: 'italic', marginBottom: 12 }}>
        Pago Completado
      </Text>

      {/* Resumen del pago */}
      <SectionTitle title="Resumen del Pago" />
      <Card>
        <RowItem
          label="Consulta Médica"
          value={`$${subtotal.toFixed(2)}`}
          date={formatDate(payment.date || payment.createdAt)}
          concept={payment.concept || 'Revisión General'}
        />
        {discount > 0 && (
          <RowItem
            label="Descuento"
            value={`- $${discount.toFixed(2)}`}
            date={formatDate(payment.date || payment.createdAt)}
            concept="Promoción"
          />
        )}
        <View
          style={{
            marginTop: 12,
            borderTopWidth: 1,
            borderColor: '#ddd',
            paddingTop: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>${total.toFixed(2)}</Text>
        </View>
      </Card>

      {/* Método de pago */}
      <SectionTitle title="Método de Pago" />
      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text>Tarjeta de Crédito</Text>
          <Ionicons name="checkmark-circle" size={20} color="#4F46E5" />
        </View>
      </Card>

      {/* Confirmación */}
      <SectionTitle title="Confirmación" />
      <Card>
        <Text>
          Su pago ha sido procesado exitosamente.{"\n"}
          Gracias por confiar en nuestros servicios.
        </Text>
      </Card>

      {/* Footer */}
      <View style={{ marginTop: 32, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#fff', backgroundColor: '#4F46E5', padding: 12, borderRadius: 8, textAlign: 'center' }}>
          Contacto: support@medaccess.com{'\n'}Tel: +1 800 123 4567
        </Text>
      </View>
    </ScrollView>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={{ fontWeight: 'bold', fontStyle: 'italic', marginVertical: 12, fontSize: 16 }}>
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 16,
      }}
    >
      {children}
    </View>
  );
}

function RowItem({
  label,
  value,
  date,
  concept,
}: {
  label: string;
  value: string;
  date: string;
  concept: string;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text>{label}</Text>
        <Text>{value}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, color: '#555' }}>Fecha: {date}</Text>
        <Text style={{ fontSize: 12, color: '#555' }}>Concepto: {concept}</Text>
      </View>
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
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return 'Fecha desconocida';
  }
}
