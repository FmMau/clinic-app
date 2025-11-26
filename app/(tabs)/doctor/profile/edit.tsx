// DoctorProfileEdit.tsx
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db, storage } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { updatePassword } from 'firebase/auth';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import {
  getDownloadURL,
  ref,
  uploadBytes
} from 'firebase/storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { MapPressEvent, Marker, Region } from 'react-native-maps';

type DoctorProfile = {
  name?: string;
  email?: string;
  specialty?: string;
  phone?: string;
  photoURL?: string;
  birthdate?: Timestamp | Date | string | null;
  location?: {
    latitude?: number;
    longitude?: number;
  } | null;
  [key: string]: any;
};

export default function DoctorProfileEdit() {
  const { loading: guardLoading, allowed } = useRoleGuard(['doctor']);
  const [data, setData] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [birthdateInput, setBirthdateInput] = useState(''); // yyyy-mm-dd
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !allowed) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'doctors', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const profile = snap.data() as DoctorProfile;

          // Normalizar birthdate a string YYYY-MM-DD para la UI
          let bdString = '';
          if (profile.birthdate instanceof Timestamp) {
            const d = profile.birthdate.toDate();
            bdString = d.toISOString().slice(0, 10);
          } else if (profile.birthdate instanceof Date) {
            bdString = profile.birthdate.toISOString().slice(0, 10);
          } else if (typeof profile.birthdate === 'string') {
            bdString = profile.birthdate.slice(0, 10);
          }
          setBirthdateInput(bdString);

          // Coordenadas y región del mapa
          if (profile.location?.latitude != null && profile.location?.longitude != null) {
            setCoordinates({
              latitude: profile.location.latitude,
              longitude: profile.location.longitude,
            });
            setMapRegion({
              latitude: profile.location.latitude,
              longitude: profile.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          } else {
            // Coordenadas por defecto (CDMX)
            setMapRegion({
              latitude: 19.4326,
              longitude: -99.1332,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
          }

          setData(profile);
        } else {
          setData(null);
        }
      } catch (e) {
        console.error('Error obteniendo perfil de doctor', e);
        Alert.alert('Error', 'No se pudo cargar el perfil.');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [allowed]);

  if (guardLoading || loading) return <LoadingScreen message="Cargando perfil..." />;
  if (!allowed) return null;
  if (!data) return <Text style={styles.status}>Perfil no encontrado</Text>;

  const handleSave = async () => {
    const { email, phone } = data;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Correo electrónico no válido.');
      return;
    }

    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      Alert.alert('Error', 'El teléfono debe tener 10 dígitos numéricos.');
      return;
    }

    if (uploading) {
      Alert.alert('Espera', 'Aguarda a que termine de subir la foto antes de guardar.');
      return;
    }

    // Validar nueva contraseña si se escribió alguna
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        return;
      }
    }

    // Parsear fecha de nacimiento si se proporcionó
    let birthdateToSave: Timestamp | null = null;
    if (birthdateInput.trim()) {
      const parsedDate = new Date(birthdateInput);
      if (isNaN(parsedDate.getTime())) {
        Alert.alert('Error', 'Fecha de nacimiento inválida. Usa el formato YYYY-MM-DD.');
        return;
      }
      birthdateToSave = Timestamp.fromDate(parsedDate);
    }

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(db, 'doctors', uid);

      const updatedData: DoctorProfile = {
        ...data,
        birthdate: birthdateToSave,
        location: coordinates || null,
      };

      await updateDoc(docRef, updatedData);

      // Actualizar contraseña en Firebase Auth si corresponde
      if (newPassword && auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      Alert.alert('Éxito', 'Datos actualizados correctamente');
      router.back();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Error',
          'Por seguridad, vuelve a iniciar sesión y luego intenta de nuevo.'
        );
      } else {
        Alert.alert('Error', 'No se pudieron guardar los cambios');
      }
    }
  };

  const handleChangePhoto = () => {
    Alert.alert('Foto de perfil', 'Selecciona una opción', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tomar foto', onPress: handlePickFromCamera },
      { text: 'Elegir de galería', onPress: handlePickFromGallery },
    ]);
  };

  const handlePickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) {
      await uploadImageToStorage(result.assets[0].uri);
    }
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Se necesita acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      await uploadImageToStorage(result.assets[0].uri);
    }
  };

  const uploadImageToStorage = async (uri: string) => {
    const uid = auth.currentUser?.uid;
    if (!uid || !data) return;

    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(storage, `doctors/${uid}/profile.jpg`);
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);

      // Guardar en estado y en Firestore
      setData({ ...data, photoURL: url });
      await updateDoc(doc(db, 'doctors', uid), { photoURL: url });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const avatarUri =
    data.photoURL ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      data.name || 'Doctor'
    )}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity onPress={handleChangePhoto} style={styles.photoContainer}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.photo} />
        ) : (
          <Ionicons name="person-circle-outline" size={100} color="#ccc" />
        )}
        <Text style={styles.photoText}>
          {uploading ? 'Subiendo...' : 'Cambiar foto'}
        </Text>
      </TouchableOpacity>

      {[
        { label: 'Nombre completo', field: 'name' },
        { label: 'Correo electrónico', field: 'email' },
        { label: 'Especialidad', field: 'specialty' },
        { label: 'Teléfono', field: 'phone' },
      ].map(({ label, field }) => (
        <View key={field} style={styles.inputGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            value={(data[field] as string) || ''}
            onChangeText={(text) => setData({ ...data, [field]: text })}
            placeholder={label}
            style={styles.input}
            autoCapitalize={field === 'name' ? 'words' : 'none'}
            keyboardType={field === 'phone' ? 'phone-pad' : 'default'}
          />
        </View>
      ))}

      {/* Fecha de nacimiento */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Fecha de nacimiento (YYYY-MM-DD)</Text>
        <TextInput
          value={birthdateInput}
          onChangeText={setBirthdateInput}
          placeholder="1990-05-21"
          style={styles.input}
          autoCapitalize="none"
        />
      </View>

      {/* Campos para contraseña */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nueva contraseña</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Nueva contraseña"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirmar contraseña"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />
      </View>

      {/* Selección de ubicación */}
      <Text style={[styles.label, { marginTop: 8 }]}>
        Selecciona ubicación en el mapa
      </Text>
      <View style={{ height: 300, marginBottom: 16 }}>
        {mapRegion && (
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            onPress={(e: MapPressEvent) => {
              const coord = e.nativeEvent.coordinate;
              setCoordinates(coord);
              setMapRegion((prev) =>
                prev
                  ? { ...prev, latitude: coord.latitude, longitude: coord.longitude }
                  : {
                      latitude: coord.latitude,
                      longitude: coord.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
              );
            }}
          >
            {coordinates && <Marker coordinate={coordinates} />}
          </MapView>
        )}
      </View>

      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Guardar cambios</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 60,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#5A5CFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  status: {
    padding: 24,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoText: {
    marginTop: 8,
    color: '#5A5CFF',
  },
});
