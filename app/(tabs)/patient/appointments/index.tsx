import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname, useRouter } from 'expo-router';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const PAGE_SIZE = 10;

export default function AllAppointments() {
  const { loading, allowed } = useRoleGuard(['paciente']);
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({});
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const uid = auth.currentUser?.uid;
  const pathname = usePathname();

  // Función para obtener citas con paginación
  const fetchAppointments = async (reset = false) => {
    if (!uid || !allowed) return;

    if (reset) {
      setLoadingList(true);
      setHasMore(true);
      setLastVisible(null);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    try {
      const baseRef = collection(db, 'appointments');

      let q: any = query(
        baseRef,
        where('patientId', '==', uid),
        orderBy('date', 'asc'),
        limit(PAGE_SIZE)
      );

      if (!reset && lastVisible) {
        q = query(
          baseRef,
          where('patientId', '==', uid),
          orderBy('date', 'asc'),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const now = new Date();
      const fetched: any[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const appointmentDate = data.date?.toDate?.();

        // Ya no borramos las citas viejas, solo no las mostramos
        if (!appointmentDate || appointmentDate >= now) {
          fetched.push({ id: docSnap.id, ...data });
        }
      });

      if (reset) {
        setAppointments(fetched);
      } else {
        setAppointments((prev) => [...prev, ...fetched]);
      }

      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error al obtener citas:', error);
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (pathname.includes('[id]')) {
        router.replace('/(tabs)/patient/appointments');
        return;
      }

      if (!uid || !allowed) return;

      const fetchDoctors = async () => {
        try {
          const map: Record<string, string> = {};
          const snap = await getDocs(collection(db, 'doctors'));
          snap.docs.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.userId) {
              map[data.userId] = data.name || 'Médico';
            }
          });
          setDoctorMap(map);
        } catch (err) {
          console.error('Error al obtener médicos:', err);
        }
      };

      const run = async () => {
        await fetchDoctors();
        await fetchAppointments(true); // primera página
      };

      run();

      // no cleanup especial
    }, [uid, allowed, pathname, router])
  );

  const cancelAppointment = (id: string) => {
    Alert.alert('Cancelar cita', '¿Deseas eliminar esta cita permanentemente?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'appointments', id));
            Alert.alert('Cita eliminada');
            // recargar lista desde el inicio
            fetchAppointments(true);
          } catch (error: any) {
            Alert.alert('Error', 'No se pudo eliminar la cita.');
            console.error(error);
          }
        },
      },
    ]);
  };

  if (loading || loadingList) {
    return <LoadingScreen message="Cargando tus citas..." />;
  }
  if (!allowed) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 }}
      contentContainerStyle={{ paddingTop: 24, paddingBottom: 80 }}
    >

      {appointments.length === 0 && (
        <Text style={{ color: '#999' }}>No tienes citas registradas.</Text>
      )}

      {appointments.map((a) => {
        const dateObj = a.date?.toDate?.();
        const dateStr = dateObj
          ? dateObj.toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : 'Fecha no disponible';

        const timeStr = dateObj
          ? dateObj.toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Hora no disponible';

        const doctorName = doctorMap[a.doctorId] || 'Médico';

        return (
          <AppointmentCard
            key={a.id}
            doctorName={doctorName}
            dateStr={dateStr}
            timeStr={timeStr}
            status={a.status}
            onView={() => router.push(`/(tabs)/patient/appointments/${a.id}`)}
            onEdit={() => router.push(`/(tabs)/patient/appointments/${a.id}/edit`)}
            onCancel={() => cancelAppointment(a.id)}
          />
        );
      })}

      {hasMore && appointments.length > 0 && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => fetchAppointments(false)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
              backgroundColor: '#5A5CFF',
              flexDirection: 'row',
              alignItems: 'center',
            }}
            disabled={loadingMore}
          >
            {loadingMore && (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {loadingMore ? 'Cargando...' : 'Cargar más'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

type AppointmentCardProps = {
  doctorName: string;
  dateStr: string;
  timeStr: string;
  status: string;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
};

function AppointmentCard({
  doctorName,
  dateStr,
  timeStr,
  status,
  onView,
  onEdit,
  onCancel,
}: AppointmentCardProps) {
  return (
    <TouchableOpacity
      onPress={onView}
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons
          name="calendar-outline"
          size={18}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={{ fontWeight: 'bold', color: '#333' }}>{doctorName}</Text>
      </View>

      <Text style={{ color: '#333', marginBottom: 4 }}>Fecha: {dateStr}</Text>
      <Text style={{ color: '#333', marginBottom: 8 }}>Hora: {timeStr}</Text>

      <StatusBadge status={status} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <TouchableOpacity
          onPress={onEdit}
          style={{
            backgroundColor: '#5A5CFF',
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="create-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Reagendar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onCancel}
          style={{
            borderColor: '#5A5CFF',
            borderWidth: 1.5,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="trash-outline" size={16} color="#5A5CFF" style={{ marginRight: 6 }} />
          <Text style={{ color: '#5A5CFF', fontWeight: 'bold' }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function StatusBadge({ status }: { status: string }) {
  let color = '#999';
  let label = 'Estado desconocido';

  switch (status) {
    case 'pendiente':
      color = '#D97706';
      label = 'Pendiente';
      break;
    case 'confirmada':
      color = '#10B981';
      label = 'Confirmada';
      break;
    case 'cancelada':
      color = '#EF4444';
      label = 'Cancelada';
      break;
    case 'completada':
      color = '#3B82F6';
      label = 'Completada';
      break;
  }

  return <Text style={{ color, fontWeight: '600' }}>{label}</Text>;
}
