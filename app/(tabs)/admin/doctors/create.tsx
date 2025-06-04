import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function CreateDoctorScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado para acceder a la ubicación');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setMapRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  const handleSubmit = async () => {
    if (!name || !specialty || !email || !phone || !coordinates) {
      Alert.alert('Faltan campos obligatorios o ubicación');
      return;
    }

    setLoading(true);

    try {
      const existing = await fetchSignInMethodsForEmail(auth, email);
      if (existing.length > 0) {
        Alert.alert('Este correo ya está registrado.');
        setLoading(false);
        return;
      }

      const password = 'cambiar1234';
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      await setDoc(doc(db, 'doctors', userId), {
        name,
        email,
        phone,
        specialty,
        location: coordinates,
        role: 'doctor',
        expoPushToken: null,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Médico registrado con éxito');
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error al registrar médico', err.message || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medkit-outline" size={24} color="#5A5CFF" />
        <Text style={styles.title}>Registrar Médico</Text>
      </View>

      {[
        { label: 'Nombre completo', value: name, set: setName },
        { label: 'Especialidad', value: specialty, set: setSpecialty },
        { label: 'Correo electrónico', value: email, set: setEmail },
        { label: 'Teléfono', value: phone, set: setPhone },
      ].map(({ label, value, set }, i) => (
        <View key={i} style={styles.inputGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={value}
            onChangeText={set}
            placeholder={label}
            style={styles.input}
            autoCapitalize="none"
            keyboardType={label.includes('Correo') ? 'email-address' : 'default'}
          />
        </View>
      ))}

      <Text style={styles.label}>Ubicación en el mapa</Text>
      <View style={styles.mapContainer}>
        {mapRegion ? (
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            onPress={(e) => setCoordinates(e.nativeEvent.coordinate)}
          >
            {coordinates && <Marker coordinate={coordinates} />}
          </MapView>
        ) : (
          <ActivityIndicator size="large" color="#5A5CFF" style={{ marginTop: 20 }} />
        )}
      </View>

      <TouchableOpacity
        disabled={loading}
        onPress={handleSubmit}
        style={styles.button}
      >
        <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Registrar Médico'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 80,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#5A5CFF',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  mapContainer: {
    height: 280,
    marginBottom: 24,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: '#ddd',
    borderWidth: 1,
  },
  button: {
    backgroundColor: '#5A5CFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
