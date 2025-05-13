import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function AppointmentDetail() {
  const { id } = useLocalSearchParams(); // ID de la cita desde la URL
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id || typeof id !== 'string') return;

      const docRef = doc(db, 'appointments', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setAppointment({ id: docSnap.id, ...docSnap.data() });
      }

      setLoading(false);
    };

    fetchAppointment();
  }, [id]);

  const cancelAppointment = async () => {
    if (!appointment) return;

    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          onPress: async () => {
            await updateDoc(doc(db, 'appointments', appointment.id), {
              status: 'cancelada',
            });
            Alert.alert('Cita cancelada');
            router.back();
          },
        },
      ]
    );
  };

  if (loading) return <Text style={{ padding: 20 }}>Cargando...</Text>;
  if (!appointment) return <Text style={{ padding: 20 }}>Cita no encontrada</Text>;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        Detalle de la cita
      </Text>

      <Text style={{ marginBottom: 8 }}>👨‍⚕️ Doctor: {appointment.doctor || 'N/A'}</Text>
      <Text style={{ marginBottom: 8 }}>🗓️ Fecha: {formatDate(appointment.date)}</Text>
      <Text style={{ marginBottom: 8 }}>📝 Motivo: {appointment.reason}</Text>
      <Text style={{ marginBottom: 16 }}>📌 Estado: {appointment.status}</Text>

      {appointment.status === 'pendiente' && (
        <TouchableOpacity
          onPress={cancelAppointment}
          style={{
            backgroundColor: '#FF5A5A',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Cancelar cita</Text>
        </TouchableOpacity>
      )}

      {appointment.status === 'atendida' && appointment.doctorNotes && (
        <View style={{ marginTop: 24, padding: 16, backgroundColor: '#F5F5F5', borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>🩺 Comentarios del médico:</Text>
          <Text>{appointment.doctorNotes}</Text>
        </View>
      )}
    </View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
