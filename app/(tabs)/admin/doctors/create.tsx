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
import type { KeyboardTypeOptions } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import MapView, { Marker } from 'react-native-maps';

export default function CreateDoctorScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Dropdown picker states
  const [openSpecialty, setOpenSpecialty] = useState(false);
  const [specialties, setSpecialties] = useState([
    { label: 'Cardiología', value: 'cardiologia' },
    { label: 'Pediatría', value: 'pediatria' },
    { label: 'Dermatología', value: 'dermatologia' },
    { label: 'Ginecología', value: 'ginecologia' },
    { label: 'Neurología', value: 'neurologia' },
  ]);

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

  const inputFields: {
    label: string;
    value: string;
    set: React.Dispatch<React.SetStateAction<string>>;
    keyboardType: KeyboardTypeOptions;
  }[] = [
    { label: 'Nombre completo', value: name, set: setName, keyboardType: 'default' },
    { label: 'Correo electrónico', value: email, set: setEmail, keyboardType: 'email-address' },
    { label: 'Teléfono', value: phone, set: setPhone, keyboardType: 'phone-pad' },
  ];

  // Contenido para el header del FlatList (inputs + dropdown + mapa + botón)
  const renderHeader = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medkit-outline" size={24} color="#5A5CFF" />
        <Text style={styles.title}>Registrar Médico</Text>
      </View>

      {inputFields.map(({ label, value, set, keyboardType }, i) => (
        <View key={i} style={styles.inputGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={value}
            onChangeText={set}
            placeholder={label}
            style={styles.input}
            autoCapitalize="none"
            keyboardType={keyboardType}
          />
        </View>
      ))}

      <View style={[styles.inputGroup, styles.dropdownWrapper]}>
        <Text style={styles.label}>Especialidad</Text>
        <DropDownPicker
          open={openSpecialty}
          value={specialty}
          items={specialties}
          setOpen={setOpenSpecialty}
          setValue={setSpecialty}
          setItems={setSpecialties}
          placeholder="Selecciona una especialidad"
          dropDownDirection="BOTTOM"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          zIndex={5000}
          zIndexInverse={6000}
        />
      </View>

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
        style={[styles.button, loading && { opacity: 0.6 }]}
      >
        <Ionicons name="person-add-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Registrar Médico'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <FlatList
        data={[]} // no hay lista real, solo para que FlatList maneje scroll
        renderItem={() => null} // Dummy renderItem to satisfy the requirement
        ListHeaderComponent={renderHeader}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        // para que flatlist ocupe todo el alto
        style={{ flex: 1 }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
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
  dropdownWrapper: {
    zIndex: 5000,
    elevation: 10, // para Android
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
  dropdown: {
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  dropdownContainer: {
    borderColor: '#ccc',
    backgroundColor: '#fff',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#5A5CFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
