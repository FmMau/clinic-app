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

type Doctor = {
  name?: string;
  email?: string;
  specialty?: string;
  photoURL?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  phone?: string;
  license?: string; // cédula, si la manejas así
  [key: string]: any;
};

export default function DoctorProfileView() {
  const { loading: guardLoading, allowed } = useRoleGuard(['doctor']);
  const [data, setData] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !allowed) return;

    const ref = doc(db, 'doctors', uid);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setData(snap.data() as Doctor);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error escuchando perfil de doctor:', error);
        setData(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [allowed]);

  if (guardLoading || loading) {
    return <LoadingScreen message="Cargando perfil..." />;
  }

  if (!allowed) return null;

  if (!data) {
    return (
      <View style={styles.centered}>
        <Ionicons
          name="alert-circle-outline"
          size={32}
          color="#9CA3AF"
          style={{ marginBottom: 8 }}
        />
        <Text style={styles.status}>Perfil no encontrado</Text>
      </View>
    );
  }

  const avatarUri =
    data.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      data.name || 'Doctor'
    )}`;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={styles.header}>
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{data.name || 'Sin nombre'}</Text>
        <Text style={styles.role}>Doctor(a)</Text>
      </View>

      {renderField('Nombre completo', data.name)}
      {renderField('Correo electrónico', data.email)}
      {renderField('Especialidad', data.specialty)}
      {data.phone && renderField('Teléfono', data.phone)}
      {data.license && renderField('Cédula profesional', data.license)}

      {data.location?.latitude != null && data.location?.longitude != null ? (
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
              title={data.name || 'Doctor'}
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
            <Ionicons
              name="create-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.editButtonText}>Editar</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function renderField(label: string, value?: string | null) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || 'No especificado'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f9f9f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  status: {
    paddingTop: 4,
    fontSize: 16,
    textAlign: 'center',
    color: '#374151',
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
    shadowOffset: { width: 0, height: 1 },
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
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  map: {
    width: '100%',
    height: 200,
    marginTop: 8,
    borderRadius: 8,
  },
});
