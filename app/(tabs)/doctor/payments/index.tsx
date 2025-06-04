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
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DoctorPaymentsIndex() {
  const { user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'payments'),
      where('doctorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const paymentData = docSnap.data();
          const patientId = paymentData.patientId;

          let patientName = 'Paciente desconocido';

          if (patientId) {
            const patientDoc = await getDoc(doc(db, 'patients', patientId));
            if (patientDoc.exists()) {
              const patientData = patientDoc.data();
              patientName = patientData?.name || patientName;
            }
          }

          return {
            id: docSnap.id,
            ...paymentData,
            patientName,
          };
        })
      );

      setPayments(data);
      setFiltered(data);
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
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}
    >
      <Section icon="card-outline" title="Pagos realizados">
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

        {filtered.map((item) => (
          <Card
            key={item.id}
            id={item.id}
            title={item.patientName || 'Paciente desconocido'}
            subtitle={`Fecha: ${formatDate(item.createdAt)}\n${item.concept}`}
            badge={`$${item.amount}`}
            onPress={() => router.push(`/(tabs)/doctor/payments/${item.id}`)}
          />
        ))}
      </Section>

      <Section icon="chatbubble-ellipses-outline" title="Valoraciones de pacientes">
        {payments.filter((p) => p.rating && p.comments).length === 0 && (
          <Text style={{ color: '#999' }}>Sin valoraciones aún.</Text>
        )}
        {payments
          .filter((p) => p.rating && p.comments)
          .map((p) => (
            <View key={p.id + '-review'} style={styles.commentCard}>
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
        <Ionicons name={icon as any} size={20} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Card({
  id,
  title,
  subtitle,
  badge,
  onPress,
}: {
  id: string;
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
});
