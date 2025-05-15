import { auth, db } from '@/lib/firebase/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

export default function PatientProfile() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const fetchProfile = async () => {
      const docRef = doc(db, 'patients', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setData(snap.data());
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const docRef = doc(db, 'patients', uid);
      await updateDoc(docRef, data);

      setEditing(false);
      Alert.alert('Éxito', 'Datos actualizados correctamente');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

  if (loading) return <Text style={styles.status}>Cargando...</Text>;
  if (!data) return <Text style={styles.status}>Perfil no encontrado</Text>;

  return (
  <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Avatar y nombre */}
      <View style={styles.header}>
        <Image
          source={{
            uri:
              data.photoURL ||
              `https://ui-avatars.com/api/?name=${data.name}+${data.lastname}`,
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{data.name} {data.lastname}</Text>
        <Text style={styles.role}>Paciente</Text>
      </View>

      {/* Campos editables */}
      <EditableField
        label="Nombre"
        value={data.name}
        onChange={(val) => setData({ ...data, name: val })}
        editable={editing}
      />
      <EditableField
        label="Apellidos"
        value={data.lastname}
        onChange={(val) => setData({ ...data, lastname: val })}
        editable={editing}
      />
      <EditableField
        label="Correo electrónico"
        value={data.email}
        onChange={(val) => setData({ ...data, email: val })}
        editable={false}
      />
      <EditableField
        label="Teléfono"
        value={data.phone}
        onChange={(val) => setData({ ...data, phone: val })}
        editable={editing}
      />
      <EditableField
        label="Dirección"
        value={data.address}
        onChange={(val) => setData({ ...data, address: val })}
        editable={editing}
      />
      <EditableField
        label="Alergias"
        value={data.allergies}
        onChange={(val) => setData({ ...data, allergies: val })}
        editable={editing}
      />
      <EditableField
        label="Sexo"
        value={data.gender}
        onChange={(val) => setData({ ...data, gender: val })}
        editable={editing}
      />
      <EditableField
        label="Fecha de nacimiento"
        value={data.birthdate}
        onChange={(val) => setData({ ...data, birthdate: val })}
        editable={editing}
      />
      <EditableField
        label="CURP"
        value={data.curp}
        onChange={(val) => setData({ ...data, curp: val })}
        editable={editing}
      />
      <EditableField
        label="Fecha de registro"
        value={formatDate(data.createdAt)}
        editable={false}
      />

      {/* Botones */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (editing) {
              handleSave();
            } else {
              setEditing(true);
            }
          }}
        >
          <Text style={styles.editButtonText}>
            {editing ? 'Guardar cambios' : 'Editar'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function EditableField({
  label,
  value,
  onChange,
  editable = false,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
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
    </View>
  );
}

function formatDate(value: any) {
  try {
    const date =
      typeof value === 'string'
        ? new Date(value)
        : new Date(value.seconds * 1000);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Desconocida';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
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
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 16,
    color: '#6366f1',
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
  },
  buttonRow: {
    marginTop: 24,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
