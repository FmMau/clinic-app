// DoctorProfileEdit.tsx
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db, storage } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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

export default function DoctorProfileEdit() {
  const { loading: guardLoading, allowed } = useRoleGuard(['doctor']);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !allowed) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'doctors', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const profile = snap.data();
        if (profile.birthdate?.seconds) {
          profile.birthdate = new Date(profile.birthdate.seconds * 1000);
        }

        if (profile.location?.latitude && profile.location?.longitude) {
          setCoordinates(profile.location);
          setMapRegion({
            latitude: profile.location.latitude,
            longitude: profile.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else {
          // Coordenadas por defecto si no hay guardadas
          setMapRegion({
            latitude: 19.4326,
            longitude: -99.1332,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }

        setData(profile);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [allowed]);

  if (guardLoading || loading) return <LoadingScreen message="Cargando perfil..." />;
  if (!allowed) return null;
  if (!data) return <Text style={styles.status}>Perfil no encontrado</Text>;

  const handleSave = async () => {
    const { email, phone, curp, birthdate } = data;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Error', 'Correo electrónico no válido.');
      return;
    }

    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      Alert.alert('Error', 'Teléfono debe tener 10 dígitos numéricos.');
      return;
    }


    let birthdateToSave: Timestamp;
    try {
      const parsedDate =
        birthdate instanceof Date
          ? birthdate
          : new Date(typeof birthdate === 'string' ? birthdate : birthdate?.seconds * 1000 || Date.now());
      if (isNaN(parsedDate.getTime())) throw new Error('Fecha inválida');
      birthdateToSave = Timestamp.fromDate(parsedDate);
    } catch {
      Alert.alert('Error', 'Fecha de nacimiento inválida');
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(db, 'doctors', uid);
      const updatedData = {
        ...data,
        birthdate: birthdateToSave,
        location: coordinates || null,
      };

      await updateDoc(docRef, updatedData);
      Alert.alert('Éxito', 'Datos actualizados correctamente');
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
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
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara');
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
      Alert.alert('Permiso requerido', 'Se necesita acceso a tu galería');
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
    if (!uid) return;

    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(storage, `doctors/${uid}/profile.jpg`);
      await uploadBytes(fileRef, blob);
      const url = await getDownloadURL(fileRef);
      setData({ ...data, photoURL: url });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>

      <TouchableOpacity onPress={handleChangePhoto} style={styles.photoContainer}>
        {data.photoURL ? (
          <Image source={{ uri: data.photoURL }} style={styles.photo} />
        ) : (
          <Ionicons name="person-circle-outline" size={100} color="#ccc" />
        )}
        <Text style={styles.photoText}>{uploading ? 'Subiendo...' : 'Cambiar foto'}</Text>
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
            value={data[field] || ''}
            onChangeText={(text) => setData({ ...data, [field]: text })}
            placeholder={label}
            style={styles.input}
            autoCapitalize="none"
          />
        </View>
      ))}

      {/* Selección de ubicación */}
      <Text style={styles.label}>Selecciona ubicación en el mapa</Text>
      <View style={{ height: 300, marginBottom: 16 }}>
        {mapRegion && (
          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            onPress={(e: MapPressEvent) => {
              const coord = e.nativeEvent.coordinate;
              setCoordinates(coord);
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
    backgroundColor: '#fff',
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
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
    marginTop: 24,
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