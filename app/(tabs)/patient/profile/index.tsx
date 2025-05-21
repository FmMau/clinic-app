import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PatientProfileView() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid || !allowed) return;

    const unsubscribe = onSnapshot(doc(db, 'patients', uid), (snap) => {
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
            uri: data.photoURL || `https://ui-avatars.com/api/?name=${data.name}+${data.lastname}`,
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{data.name} {data.lastname}</Text>
        <Text style={styles.role}>Paciente</Text>
      </View>

      {renderField('Nombre', data.name)}
      {renderField('Apellidos', data.lastname)}
      {renderField('Correo electrónico', data.email)}
      {renderField('Teléfono', data.phone)}
      {renderField('Dirección', data.address)}
      {renderField('Alergias', data.allergies)}
      {renderField('Sexo', data.gender)}
      {renderField('Fecha de nacimiento', formatDate(data.birthdate))}
      {renderField('CURP', data.curp)}
      {renderField('Fecha de registro', formatDate(data.createdAt))}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push('/(tabs)/patient/profile/edit')}
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
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.input}>{value || 'No especificado'}</Text>
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
