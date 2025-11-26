import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type Payment = {
  patientId?: string;
  amount?: number;
  concept?: string;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number };
  method?: string;
  status?: string;
  comments?: string;
  rating?: number;
  specialty?: string;
  [key: string]: any;
};

type Patient = {
  name?: string;
  lastname?: string;
  [key: string]: any;
};

export default function DoctorPaymentDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const paymentId = useMemo(() => {
    const value = params.id;
    if (Array.isArray(value)) return value[0];
    return value;
  }, [params.id]);

  const [payment, setPayment] = useState<(Payment & { patientName?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!paymentId) return;

    const fetchPayment = async () => {
      try {
        const paymentDocRef = doc(db, 'payments', paymentId);
        const paymentDocSnap = await getDoc(paymentDocRef);

        if (!paymentDocSnap.exists()) {
          setPayment(null);
          setLoading(false);
          return;
        }

        const paymentData = paymentDocSnap.data() as Payment;

        // Traer paciente
        let patientName = 'Paciente desconocido';
        if (paymentData.patientId) {
          try {
            const patientDocRef = doc(db, 'patients', paymentData.patientId);
            const patientDocSnap = await getDoc(patientDocRef);
            if (patientDocSnap.exists()) {
              const patientData = patientDocSnap.data() as Patient;
              const name = patientData?.name || '';
              const lastname = patientData?.lastname || '';
              const full = `${name} ${lastname}`.trim();
              if (full) patientName = full;
            }
          } catch (e) {
            console.error('Error al obtener paciente del pago:', e);
          }
        }

        setPayment({ ...paymentData, patientName });
      } catch (err) {
        console.error('Error al obtener pago:', err);
        setPayment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [paymentId]);

  const formatDate = (value: Payment['createdAt']) => {
    if (!value) return 'No disponible';

    let date: Date | null = null;

    if (value instanceof Timestamp) {
      date = value.toDate();
    } else if (typeof value === 'object' && typeof value.seconds === 'number') {
      date = new Date(value.seconds * 1000);
    }

    if (!date || isNaN(date.getTime())) return 'No disponible';

    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return '$0.00';
    try {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
      }).format(amount);
    } catch {
      return `$${amount.toFixed(2)}`;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5A5CFF" />
        <Text style={{ marginTop: 8, color: '#555' }}>Cargando...</Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="alert-circle-outline"
          size={32}
          color="#9CA3AF"
          style={{ marginBottom: 8 }}
        />
        <Text style={styles.status}>Pago no encontrado</Text>
      </View>
    );
  }

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
  } = payment;

  const safeRating =
    typeof rating === 'number' && rating > 0 ? Math.round(rating) : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="card-outline"
          size={22}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.title}>Detalle del Pago</Text>
      </View>

      <Card>
        <Label title="Paciente" value={patientName || 'No disponible'} />
        <Label title="Concepto" value={concept || 'Consulta médica'} />
        <Label title="Fecha" value={formatDate(createdAt)} />
        <Label title="Monto" value={formatCurrency(amount)} />
        <Label title="Estado" value={status || 'pendiente'} />
        <Label title="Método" value={method || 'No registrado'} />
        <Label title="Especialidad" value={specialty || '---'} />
      </Card>

      {comments ? (
        <>
          <Text style={styles.sectionSubtitle}>Valoración del paciente</Text>
          <Card>
            <Text style={styles.comment}>"{comments}"</Text>
            <View style={styles.rating}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < safeRating ? 'star' : 'star-outline'}
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
  return <View style={styles.card}>{children}</View>;
}

function Label({ title, value }: { title: string; value: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  center: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  label: {
    fontWeight: '600',
    color: '#5A5CFF',
    marginBottom: 2,
  },
  value: {
    color: '#333',
  },
  comment: {
    fontStyle: 'italic',
    marginBottom: 8,
    color: '#333',
  },
  rating: {
    flexDirection: 'row',
  },
  status: {
    padding: 4,
    textAlign: 'center',
    color: '#333',
  },
});
