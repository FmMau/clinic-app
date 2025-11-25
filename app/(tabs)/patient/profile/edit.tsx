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
  Platform,
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
    const loadProfile = async () => {
      const uid = auth.currentUser?.uid;

      if (!allowed || !uid) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'patients', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setData(snap.data());
        } else {
          setData(null);
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [allowed]);

  if (guardLoading || loading) {
    return <LoadingScreen message="Cargando perfil..." />;
  }
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
      const parsedDate = getValidDate(birthdate);
      if (isNaN(parsedDate.getTime())) throw new Error('Fecha inválida');
      birthdateToSave = Timestamp.fromDate(parsedDate);
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
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
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
      allowsEditing: true,
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

      setData((prev: any) => ({
        ...prev,
        photoURL: url,
      }));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    try {
      const fileRef = ref(storage, `patients/${uid}/profile.jpg`);
      await deleteObject(fileRef);

      setData((prev: any) => ({
        ...prev,
        photoURL: '',
      }));

      Alert.alert('Foto eliminada');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo eliminar la foto');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleChangePhoto}>
          <Image
            source={{
              uri:
                data.photoURL ||
                `https://ui-avatars.com/api/?name=${data.name}+${data.lastname}`,
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.name}>
          {data.name} {data.lastname}
        </Text>
        <Text style={styles.role}>Paciente</Text>
        {uploading && (
          <Text style={{ fontSize: 12, color: '#888' }}>
            Subiendo imagen...
          </Text>
        )}
        {data.photoURL && (
          <TouchableOpacity onPress={handleDeletePhoto} style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 13, color: '#f43f5e' }}>
              Eliminar foto de perfil
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {renderField('Nombre', data.name, (val) =>
        setData((prev: any) => ({ ...prev, name: val }))
      )}
      {renderField('Apellidos', data.lastname, (val) =>
        setData((prev: any) => ({ ...prev, lastname: val }))
      )}
      {renderField(
        'Correo electrónico',
        data.email,
        undefined,
        false // no editable
      )}
      {renderField('Teléfono', data.phone, (val) =>
        setData((prev: any) => ({ ...prev, phone: val }))
      )}
      {renderField('Dirección', data.address, (val) =>
        setData((prev: any) => ({ ...prev, address: val }))
      )}
      {renderField('Alergias', data.allergies, (val) =>
        setData((prev: any) => ({ ...prev, allergies: val }))
      )}
      {renderField('Sexo', data.gender, (val) =>
        setData((prev: any) => ({ ...prev, gender: val }))
      )}

      {renderField(
        'Fecha de nacimiento',
        formatDate(getValidDate(data.birthdate)),
        undefined,
        true,
        true,
        () => setDateModalVisible(true)
      )}

      <DateTimePickerModal
        isVisible={isDateModalVisible}
        mode="date"
        date={getValidDate(data.birthdate)}
        maximumDate={new Date()}
        onConfirm={(date) => {
          setData((prev: any) => ({ ...prev, birthdate: date }));
          setDateModalVisible(false);
        }}
        onCancel={() => setDateModalVisible(false)}
      />

      {renderField('CURP', data.curp, (val) =>
        setData((prev: any) => ({ ...prev, curp: val }))
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.editButton} onPress={handleSave}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name="checkmark-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
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
  editable: boolean = true,
  isDate: boolean = false,
  onDatePress?: () => void
) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {isDate ? (
        <TouchableOpacity
          onPress={onDatePress}
          disabled={!editable}
          style={{
            backgroundColor: editable ? '#fff' : '#f4f4f4',
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
          }}
        >
          <Text style={{ color: '#444' }}>
            {value || 'Selecciona una fecha'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TextInput
          value={value || ''}
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
    const date = getValidDate(value);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Desconocida';
  }
}

function getValidDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  if (value?.seconds) return new Date(value.seconds * 1000);
  return new Date();
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
  field: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f4f4f4',
    color: '#444',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
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
});
