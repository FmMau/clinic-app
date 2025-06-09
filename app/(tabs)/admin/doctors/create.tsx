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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import MapView, { Marker } from 'react-native-maps';

/**
 * CreateDoctorScreen Component
 *
 * Este componente permite registrar un nuevo médico en la aplicación. 
 * Utiliza prácticas y estándares modernos de desarrollo en React y TypeScript, 
 * incluyendo el uso de hooks, manejo de estado, y componentes reutilizables.
 *
 * Principales características:
 * - Uso de `useState` para manejar el estado local de los campos del formulario.
 * - Validación de campos obligatorios antes de enviar los datos.
 * - Integración con Firebase para registrar al médico y almacenar sus datos en Firestore.
 * - Uso de `react-native-maps` para seleccionar la ubicación del médico en un mapa.
 * - Implementación de un dropdown para seleccionar la especialidad del médico utilizando `DropDownPicker`.
 * - Manejo de permisos de ubicación con `expo-location`.
 * - Diseño responsivo con `KeyboardAvoidingView` para mejorar la experiencia en dispositivos móviles.
 *
 * Prácticas y estándares utilizados:
 * - **Separación de responsabilidades**: Cada parte del componente tiene una función clara, como manejar el estado, renderizar la UI, o interactuar con Firebase.
 * - **Uso de hooks**: Se utilizan hooks como `useState` y `useEffect` para manejar el estado y efectos secundarios, siguiendo las mejores prácticas de React.
 * - **Validación de datos**: Se valida que todos los campos obligatorios estén completos antes de enviar los datos, mejorando la robustez del componente.
 * - **Accesibilidad**: Uso de `keyboardShouldPersistTaps` y `KeyboardAvoidingView` para mejorar la experiencia del usuario en dispositivos móviles.
 * - **Código reutilizable**: Los campos de entrada se generan dinámicamente a partir de un arreglo de configuraciones, reduciendo la repetición de código.
 * - **Manejo de errores**: Se implementa un manejo de errores robusto con `try-catch` y mensajes de alerta para informar al usuario.
 * - **Estilo modular**: Los estilos están organizados en un objeto `styles`, lo que facilita su mantenimiento y modificación.
 *
 * @returns {JSX.Element} Pantalla de registro de médicos.
 */
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
        userId,
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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

          {/* espacio adicional cuando el dropdown está abierto */}
          <View style={{ height: openSpecialty ? 200 : 0 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    backgroundColor: '#fff',
    paddingBottom: 40, // por el teclado y botón
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
    elevation: 10,
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
