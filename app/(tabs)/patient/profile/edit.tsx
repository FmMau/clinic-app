import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db, storage } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
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
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function PatientProfileEdit() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !allowed) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'patients', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) setData(snap.data());
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

    if (!curp || curp.length !== 18) {
      Alert.alert('Error', 'La CURP debe tener 18 caracteres.');
      return;
    }

    let birthdateToSave: Timestamp;
    try {
      const tempDate = new Date(data.birthdate);
      if (isNaN(tempDate.getTime())) throw new Error('Fecha inválida');
      birthdateToSave = Timestamp.fromDate(tempDate);
    } catch {
      Alert.alert('Error', 'Fecha de nacimiento inválida');
      return;
    }

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(db, 'patients', uid);
      const updatedData = {
        ...data,
        birthdate: birthdateToSave,
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

      const fileRef = ref(storage, `patients/${uid}/profile.jpg`);
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

  const handleDeletePhoto = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const fileRef = ref(storage, `patients/${uid}/profile.jpg`);
      await deleteObject(fileRef);
      setData({ ...data, photoURL: '' });
      Alert.alert('Foto eliminada');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo eliminar la foto');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleChangePhoto}>
          <Image
            source={{
              uri: data.photoURL || `https://ui-avatars.com/api/?name=${data.name}+${data.lastname}`,
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.name}>{data.name} {data.lastname}</Text>
        <Text style={styles.role}>Paciente</Text>
        {uploading && <Text style={{ fontSize: 12, color: '#888' }}>Subiendo imagen...</Text>}
        {data.photoURL && (
          <TouchableOpacity onPress={handleDeletePhoto} style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: '#f43f5e' }}>Eliminar foto de perfil</Text>
          </TouchableOpacity>
        )}
      </View>

      {renderField("Nombre", data.name, (val) => setData({ ...data, name: val }), true)}
      {renderField("Apellidos", data.lastname, (val) => setData({ ...data, lastname: val }), true)}
      {renderField("Correo electrónico", data.email, undefined, false)}
      {renderField("Teléfono", data.phone, (val) => setData({ ...data, phone: val }), true)}
      {renderField("Dirección", data.address, (val) => setData({ ...data, address: val }), true)}
      {renderField("Alergias", data.allergies, (val) => setData({ ...data, allergies: val }), true)}
      {renderField("Sexo", data.gender, (val) => setData({ ...data, gender: val }), true)}

      {renderField(
        "Fecha de nacimiento",
        data.birthdate ? formatDate(data.birthdate) : '',
        undefined,
        true,
        true,
        () => setDateModalVisible(true)
      )}

      <DateTimePickerModal
        isVisible={isDateModalVisible}
        mode="date"
        date={data.birthdate ? new Date(data.birthdate) : new Date()}
        maximumDate={new Date()}
        onConfirm={(date) => {
          setData({ ...data, birthdate: date.toISOString() });
          setDateModalVisible(false);
        }}
        onCancel={() => setDateModalVisible(false)}
      />

      {renderField("CURP", data.curp, (val) => setData({ ...data, curp: val }), true)}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.editButton} onPress={handleSave}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.editButtonText}>Guardar cambios</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function renderField(
  label: string,
  value: string,
  onChange?: (val: string) => void,
  editable: boolean = false,
  isDate: boolean = false,
  onDatePress?: () => void
) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {editable && isDate ? (
        <TouchableOpacity
          onPress={onDatePress}
          style={{
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
          }}
        >
          <Text style={{ color: '#444' }}>{value || 'Selecciona una fecha'}</Text>
        </TouchableOpacity>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChange}
          editable={editable}
          selectTextOnFocus={editable}
          style={[
            styles.input,
            editable && { backgroundColor: '#fff', borderColor: '#ccc' },
          ]}
        />
      )}
    </View>
  );
}

function formatDate(value: any) {
  try {
    let date;
    if (typeof value === 'string') date = new Date(value);
    else if (value?.seconds) date = new Date(value.seconds * 1000);
    else return 'Desconocida';
    return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return 'Desconocida';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  status: { padding: 20, fontSize: 16, textAlign: 'center' },
  header: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: 'bold' },
  role: { fontSize: 16, color: '#6366f1' },
  field: { marginBottom: 16 },
  label: { fontWeight: 'bold', marginBottom: 4, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f4f4f4',
    color: '#444',
  },
  buttonRow: { marginTop: 24, alignItems: 'center' },
  editButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
