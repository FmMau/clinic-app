import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Payment = {
  id: string;
  doctorId: string;
  patientId?: string;
  concept?: string;
  amount?: number;
  createdAt?: Timestamp | { seconds: number; nanoseconds?: number };
  rating?: number;
  comments?: string;
  [key: string]: any;
};

type PaymentWithPatient = Payment & {
  patientName: string;
};

export default function DoctorPaymentsIndex() {
  const { user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentWithPatient[]>([]);
  const [filtered, setFiltered] = useState<PaymentWithPatient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'payments'),
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Cache simple de pacientes en memoria
    const patientCache: Record<string, string> = {};

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const data: PaymentWithPatient[] = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const paymentData = docSnap.data() as Payment;
            const patientId = paymentData.patientId;
            let patientName = 'Paciente desconocido';

            if (patientId) {
              if (patientCache[patientId]) {
                patientName = patientCache[patientId];
              } else {
                const patientDoc = await getDoc(doc(db, 'patients', patientId));
                if (patientDoc.exists()) {
                  const patientData = patientDoc.data();
                  patientName = (patientData?.name as string) || patientName;
                  patientCache[patientId] = patientName;
                }
              }
            }

            // Exclude possible 'id' from Firestore document data to avoid duplicate property in object literal
            const { id: _id, ...paymentRest } = paymentData as any;

            return {
              ...paymentRest,
              id: docSnap.id,
              patientName,
            };
          })
        );

        setPayments(data);
        setFiltered(data);
      } catch (e) {
        console.error('Error cargando pagos del doctor', e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const s = search.trim().toLowerCase();
    setFiltered(
      s
        ? payments.filter((p) => p.patientName?.toLowerCase().includes(s))
        : payments
    );
  }, [search, payments]);

  const formatDate = (value: Payment['createdAt']) => {
    if (!value) return '';
    let date: Date | null = null;

    if (value instanceof Timestamp) {
      date = value.toDate();
    } else if (typeof value === 'object' && typeof value.seconds === 'number') {
      date = new Date(value.seconds * 1000);
    }

    if (!date || isNaN(date.getTime())) return '';

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

  const totalIngresos = useMemo(
    () =>
      payments.reduce((acc, p) => acc + (typeof p.amount === 'number' ? p.amount : 0), 0),
    [payments]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5A5CFF" />
        <Text style={{ marginTop: 8, color: '#555' }}>Cargando pagos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}
    >
      <Section icon="card-outline" title="Pagos realizados">
        {/* Resumen */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total de ingresos</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalIngresos)}</Text>
          <Text style={styles.summaryHint}>
            {payments.length} {payments.length === 1 ? 'pago' : 'pagos'} registrados
          </Text>
        </View>

        {/* Buscador */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#999"
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Buscar paciente..."
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, padding: 0 }}
          />
        </View>

        {filtered.length === 0 ? (
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 12 }}>
            {payments.length === 0
              ? 'Aún no tienes pagos registrados.'
              : 'No se encontraron pagos con ese paciente.'}
          </Text>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              title={item.patientName || 'Paciente desconocido'}
              subtitle={`Fecha: ${formatDate(item.createdAt)}\n${
                item.concept || 'Sin concepto'
              }`}
              badge={formatCurrency(item.amount)}
              onPress={() => router.push(`/(tabs)/doctor/payments/${item.id}`)}
            />
          ))
        )}
      </Section>

      <Section icon="chatbubble-ellipses-outline" title="Valoraciones de pacientes">
        {payments.filter((p) => p.rating && p.comments).length === 0 && (
          <Text style={{ color: '#999' }}>Sin valoraciones aún.</Text>
        )}
        {payments
          .filter((p) => p.rating && p.comments)
          .map((p) => (
            <View key={p.id + '-review'} style={styles.commentCard}>
              {/* Rating simple con estrellas si quieres embellecer */}
              {typeof p.rating === 'number' && (
                <Text style={{ marginBottom: 4, color: '#F59E0B' }}>
                  {'★'.repeat(Math.round(p.rating)) +
                    '☆'.repeat(5 - Math.round(p.rating))}
                </Text>
              )}
              <Text style={{ fontStyle: 'italic', marginBottom: 8 }}>
                "{p.comments}"
              </Text>
              <Text
                style={{ textAlign: 'right', color: '#5A5CFF', fontWeight: '600' }}
              >
                – {p.patientName || 'Paciente'}
              </Text>
            </View>
          ))}
      </Section>
    </ScrollView>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 32 }}>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Card({
  title,
  subtitle,
  badge,
  onPress,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={{ color: '#5A5CFF', fontWeight: 'bold', marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ color: '#333', marginBottom: 6 }}>{subtitle}</Text>
      {badge && <Text style={{ fontWeight: '600', color: '#10B981' }}>{badge}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  searchBox: {
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
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  commentCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCard: {
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginTop: 4,
  },
  summaryHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
