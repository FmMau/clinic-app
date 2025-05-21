import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
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

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !allowed) return;

    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', uid),
      where('status', '==', 'pendiente'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    });

    return () => unsubscribe();
  }, [uid, allowed]);

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
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 20 }}>Próximas Citas</Text>

      {appointments.length === 0 && (
        <Text style={{ color: '#999' }}>No tienes citas pendientes.</Text>
      )}

      {appointments.map((a) => {
        const dateObj = new Date(a.date);
        const dateStr = dateObj.toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const timeStr = dateObj.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        });

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
                Dr. {a.doctor || 'Consulta'}
              </Text>
            </View>

            <Text style={{ color: '#333', marginBottom: 4 }}>Fecha: {dateStr}</Text>
            <Text style={{ color: '#333', marginBottom: 12 }}>Hora: {timeStr}</Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => router.push(`/(tabs)/patient/appointments/${a.id}?edit=1`)}
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
