import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
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

  if (loading) return <Text style={styles.status}>Cargando...</Text>;
  if (!payment) return <Text style={styles.status}>Pago no encontrado</Text>;

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
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="card-outline" size={22} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Detalle del Pago</Text>
      </View>

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
          <Text style={styles.sectionSubtitle}>Valoración del paciente</Text>
          <Card>
            <Text style={styles.comment}>"{comments}"</Text>
            <View style={styles.rating}>
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
    <View style={styles.card}>
      {children}
    </View>
  );
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
    padding: 24,
    textAlign: 'center',
    color: '#333',
  },
});
