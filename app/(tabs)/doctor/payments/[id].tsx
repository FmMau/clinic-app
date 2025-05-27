import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    Text,
    View,
} from 'react-native';

export default function DoctorPaymentDetail() {
  const { id } = useLocalSearchParams();
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchPayment = async () => {
      try {
        const docRef = doc(db, 'payments', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPayment(docSnap.data());
        } else {
          setPayment(null);
        }
      } catch (err) {
        console.error('Error al obtener pago:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [id]);

  if (loading) return <Text style={{ padding: 20 }}>Cargando...</Text>;
  if (!payment) return <Text style={{ padding: 20 }}>Pago no encontrado</Text>;

  const {
    patientName,
    amount,
    concept,
    createdAt,
    method,
    status,
    comments,
    rating,
    specialty,
    location,
  } = payment;

  const formatDate = (value: any) => {
    if (!value) return '';
    const date = new Date(value?.seconds * 1000);
    return date.toLocaleDateString('es-MX');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 12 }}>
        Detalle del Pago
      </Text>

      <Card>
        <Label title="Paciente" value={patientName || 'No disponible'} />
        <Label title="Concepto" value={concept || 'Consulta médica'} />
        <Label title="Fecha" value={formatDate(createdAt)} />
        <Label title="Monto" value={`$${amount}`} />
        <Label title="Estado" value={status || 'pendiente'} />
        <Label title="Método" value={method || 'No registrado'} />
        <Label title="Especialidad" value={specialty || '---'} />
        <Label title="Ubicación" value={location || '---'} />
      </Card>

      {comments ? (
        <>
          <Text style={{ fontSize: 18, fontWeight: 'bold', fontStyle: 'italic', marginTop: 24 }}>
            Valoración del paciente
          </Text>
          <Card>
            <Text style={{ fontStyle: 'italic', marginBottom: 8 }}>
              "{comments}"
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < rating ? 'star' : 'star-outline'}
                  size={24}
                  color="#FBBF24"
                />
              ))}
            </View>
          </Card>
        </>
      ) : null}
    </ScrollView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}

function Label({ title, value }: { title: string; value: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 2 }}>{title}</Text>
      <Text>{value}</Text>
    </View>
  );
}
