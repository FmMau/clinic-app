import { auth, db } from '@/lib/firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

export default function PatientProfile() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Text style={{ padding: 20 }}>Cargando...</Text>;
  if (!data) return <Text style={{ padding: 20 }}>Perfil no encontrado</Text>;

  return (
    <ScrollView style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        Mi expediente clínico
      </Text>

      <Field label="Nombre completo" value={`${data.name} ${data.lastname}`} />
      <Field label="Correo electrónico" value={data.email} />
      <Field label="Teléfono" value={data.phone} />
      <Field label="Fecha de nacimiento" value={data.birthdate} />
      <Field label="Sexo" value={data.gender} />
      <Field label="CURP / ID" value={data.curp || 'No especificado'} />
      <Field label="Dirección" value={data.address} />
      <Field label="Alergias" value={data.allergies || 'Ninguna'} />
      <Field label="Fecha de registro" value={formatDate(data.createdAt)} />
    </ScrollView>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

function formatDate(value: any) {
  try {
    const date = typeof value === 'string'
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
