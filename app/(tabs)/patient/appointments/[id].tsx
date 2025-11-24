import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

function LocationDisplay({ location }: { location?: { latitude: number; longitude: number } }) {
  const hasCoords = location?.latitude && location?.longitude;

  return (
    <>
      <Text style={{ color: '#444', marginBottom: 12 }}>
        <Text style={{ fontWeight: 'bold' }}>Ubicación:</Text>{' '}
      </Text>

      {hasCoords ? (
        <MapView
          style={{
            width: '100%',
            height: 200,
            borderRadius: 8,
          }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
        </MapView>
      ) : (
        <View
          style={{
            height: 120,
            borderRadius: 8,
            backgroundColor: '#EEE',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#aaa', textAlign: 'center' }}>
            Ubicación no disponible
          </Text>
        </View>
      )}
    </>
  );
}

export default function AppointmentDetail() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!id || typeof id !== 'string' || !allowed) return;

      try {
        const snap = await getDoc(doc(db, 'appointments', id));
        if (snap.exists()) {
          setAppointment({ id: snap.id, ...snap.data() });
        } else {
          setAppointment(null);
        }
      } catch (err) {
        console.error('Error obteniendo cita:', err);
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [id, allowed]);

  if (guardLoading || loading) return <LoadingScreen message="Cargando cita..." />;
  if (!allowed) return null;
  if (!appointment) return <Text style={{ padding: 20 }}>Cita no encontrada</Text>;

  const dateObj = appointment.date?.toDate?.() ?? new Date();
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
              {appointment.doctor || 'N/A'}
            </Text>
            <Text style={{ color: '#888' }}>{appointment.specialty || 'Especialidad'}</Text>
          </View>
        </View>

        <Text style={{ color: '#444', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold' }}>Fecha y Hora:</Text> {dateStr} - {timeStr}
        </Text>

        <LocationDisplay location={appointment.location} />
      </View>
    </ScrollView>
  );
}
