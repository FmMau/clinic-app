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
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AllAppointments() {
  const { loading, allowed } = useRoleGuard(['paciente']);
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({});
  const uid = auth.currentUser?.uid;
  const pathname = usePathname();

  useFocusEffect(
    useCallback(() => {
      if (pathname.includes('[id]')) {
        router.replace('/(tabs)/patient/appointments');
        return;
      }

      if (!uid || !allowed) return;

      const fetchDoctors = async () => {
        const snap = await getDocs(collection(db, 'doctors'));
        const map: Record<string, string> = {};
        snap.docs.forEach((doc) => {
          const data = doc.data();
          map[doc.id] = data.name || 'Médico';
        });
        setDoctorMap(map);
      };

      fetchDoctors();

      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', uid),
        orderBy('date', 'asc')
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const now = new Date();
        const validAppointments: any[] = [];

        await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const docData = docSnap.data();
            const appointmentDate = docData.date?.toDate?.();

            if (appointmentDate && appointmentDate < now) {
              await deleteDoc(doc(db, 'appointments', docSnap.id));
            } else {
              validAppointments.push({ id: docSnap.id, ...docData });
            }
          })
        );

        setAppointments(validAppointments);
      });

      return () => unsubscribe();
    }, [uid, allowed])
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
          } catch (error: any) {
            Alert.alert('Error', 'No se pudo eliminar la cita.');
            console.error(error);
          }
        },
      },
    ]);
  };

  if (loading) return <LoadingScreen message="Cargando tus citas..." />;
  if (!allowed) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff', paddingHorizontal: 24 }}
      contentContainerStyle={{ paddingTop: 24, paddingBottom: 80 }}
    >
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Tus Citas</Text>

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
          <TouchableOpacity
            key={a.id}
            onPress={() => router.push(`/(tabs)/patient/appointments/${a.id}`)}
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
              <Text style={{ fontWeight: 'bold', color: '#333' }}>
                {doctorName}
              </Text>
            </View>

            <Text style={{ color: '#333', marginBottom: 4 }}>Fecha: {dateStr}</Text>
            <Text style={{ color: '#333', marginBottom: 8 }}>Hora: {timeStr}</Text>

            <StatusBadge status={a.status} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => router.push(`/(tabs)/patient/appointments/${a.id}/edit`)}
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
                onPress={() => cancelAppointment(a.id)}
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
      })}
    </ScrollView>
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

  return (
    <Text style={{ color, fontWeight: '600' }}>
      {label}
    </Text>
  );
}
