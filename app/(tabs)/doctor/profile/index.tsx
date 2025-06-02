import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function DoctorProfileView() {
  const { loading: guardLoading, allowed } = useRoleGuard(['doctor']);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !allowed) return;

    const unsubscribe = onSnapshot(doc(db, 'doctors', uid), (snap) => {
      if (snap.exists()) setData(snap.data());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowed]);

  if (guardLoading || loading) return <LoadingScreen message="Cargando perfil..." />;
  if (!allowed) return null;
  if (!data) return <Text style={styles.status}>Perfil no encontrado</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <Image
          source={{
            uri: data.photoURL || `https://ui-avatars.com/api/?name=${data.name}`,
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{data.name}</Text>
        <Text style={styles.role}>Doctor(a)</Text>
      </View>

      {renderField('Nombre completo', data.name)}
      {renderField('Correo electrónico', data.email)}
      {renderField('Especialidad', data.specialty)}
      {data.location?.latitude && data.location?.longitude ? (
        <View style={styles.mapCard}>
        <Text style={styles.label}>Ubicación</Text>
        <MapView
          style={styles.map}
          region={{
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            }}
            title={data.name}
            description="Ubicación del doctor"
          />
        </MapView>
      </View>
) : (
  renderField('Ubicación', 'No especificada')
)}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/(tabs)/doctor/profile/edit')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.editButtonText}>Editar</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function renderField(label: string, value: string) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'No especificado'}</Text>
    </View>
  );
}

function formatDate(value: any) {
  try {
    let date;
    if (typeof value === 'string') date = new Date(value);
    else if (value?.seconds) date = new Date(value.seconds * 1000);
    else return 'Desconocida';

    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Desconocida';
  }
}

function formatLocation(value: any) {
  if (!value || typeof value !== 'object') return 'No especificada';
  const { latitude, longitude } = value;
  if (latitude == null || longitude == null) return 'No especificada';
  return `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9f9f9',
  },
  status: {
    padding: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  role: {
    fontSize: 16,
    color: '#4F46E5',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  value: {
    fontSize: 16,
    color: '#222',
  },
  buttonRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  map: {
    width: '100%',
    height: 200,
    marginTop: 8,
    borderRadius: 8,
  },
});
