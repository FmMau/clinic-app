import LoadingScreen from '@/components/ui/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
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

const PAGE_SIZE = 10;

export default function PaymentsIndex() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const router = useRouter();
  const { user } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const uid = user?.uid;

  const fetchPayments = async (reset = false) => {
    if (!uid || !allowed) return;

    if (reset) {
      setLoadingList(true);
      setHasMore(true);
      setLastVisible(null);
      setPayments([]);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    try {
      const paymentsRef = collection(db, 'payments');

      let q: any = query(
        paymentsRef,
        where('patientId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );

      if (!reset && lastVisible) {
        q = query(
          paymentsRef,
          where('patientId', '==', uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const safeData = typeof data === 'object' && data !== null ? data : {};
        return {
          id: docSnap.id,
          ...(safeData as Record<string, any>),
        };
      });

      setPayments((prev) => (reset ? fetched : [...prev, ...fetched]));

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error al obtener pagos:', error);
      setHasMore(false);
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!uid || !allowed) {
      setLoadingList(false);
      return;
    }
    fetchPayments(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, allowed]);

  if (guardLoading || loadingList) {
    return <LoadingScreen message="Cargando pagos..." />;
  }

  if (!allowed) return null;

  if (!payments.length) {
    return (
      <View style={{ padding: 24 }}>
        <Text style={{ fontSize: 16 }}>No hay pagos registrados aún.</Text>
      </View>
    );
  }

  const handleNavigation = (item: any) => {
    if (item.status === 'pendiente') {
      router.push(`/(tabs)/patient/payments/${item.id}/pay`);
    } else if (!item.rating) {
      router.push(`/(tabs)/patient/payments/${item.id}/review`);
    } else {
      router.push(`/(tabs)/patient/payments/${item.id}`);
    }
  };

  return (
    <FlatList
      data={payments}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      renderItem={({ item }) => {
        const isPending = item.status === 'pendiente';
        const isPaid = item.status === 'pagado';
        const isRated = !!item.rating;

        let actionText = 'Ver Detalles';
        let statusText = 'Pagado';
        let statusColor = '#27ae60';
        let iconName: keyof typeof Ionicons.glyphMap =
          'checkmark-done-circle-outline';

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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name="card-outline"
                  size={18}
                  color="#5A5CFF"
                  style={{ marginRight: 6 }}
                />
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
              <Text style={{ fontSize: 16, fontWeight: '600' }}>
                ${item.amount}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={iconName}
                  size={16}
                  color={statusColor}
                  style={{ marginRight: 4 }}
                />
                <Text style={{ color: statusColor, fontSize: 14 }}>
                  {statusText}
                </Text>
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
      ListFooterComponent={
        hasMore ? (
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => fetchPayments(false)}
              disabled={loadingMore}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                backgroundColor: '#5A5CFF',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              {loadingMore && (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
              )}
              <Text
                style={{ color: '#fff', fontWeight: 'bold' }}
              >
                {loadingMore ? 'Cargando...' : 'Cargar más'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
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
