import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function AppointmentDetail() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !allowed) return;

    const unsubscribe = onSnapshot(doc(db, 'appointments', id), (docSnap) => {
      if (docSnap.exists()) {
        setAppointment({ id: docSnap.id, ...docSnap.data() });
      } else {
        setAppointment(null);
      }
    });

    return () => unsubscribe();
  }, [id, allowed]);

  if (guardLoading) return <LoadingScreen message="Cargando cita..." />;
  if (!allowed) return null;
  if (!appointment) return <Text style={{ padding: 20 }}>Cita no encontrada</Text>;

  const dateObj = new Date(appointment.date);
  const dateStr = dateObj.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = dateObj.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <ScrollView style={{ flex: 1, padding: 24, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#5A5CFF', marginBottom: 16 }}>
        Detalle de Cita
      </Text>

      <View
        style={{
          backgroundColor: '#fff',
          padding: 20,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 3,
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: '#E5E7FF',
              borderRadius: 999,
              padding: 12,
              marginRight: 12,
            }}
          >
            <Ionicons name="person-outline" size={24} color="#5A5CFF" />
          </View>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>
              Dr. {appointment.doctor || 'N/A'}
            </Text>
            <Text style={{ color: '#888' }}>{appointment.specialty || 'Especialidad'}</Text>
          </View>
        </View>

        <Text style={{ color: '#444', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>Fecha y Hora:</Text> {dateStr} - {timeStr}
        </Text>

        <Text style={{ color: '#444', marginBottom: 12 }}>
          <Text style={{ fontWeight: 'bold' }}>Ubicación:</Text>{' '}
          {appointment.location || 'Clínica Central'}
        </Text>

        <View
          style={{
            height: 120,
            borderRadius: 8,
            backgroundColor: '#EEE',
            overflow: 'hidden',
          }}
        >
          <Text style={{ padding: 16, color: '#aaa', textAlign: 'center' }}>
            [Aquí iría un mapa]
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
