import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function RecordDetail() {
  const { id } = useLocalSearchParams();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id || typeof id !== 'string') return;

      const docRef = doc(db, 'medicalRecords', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setRecord(docSnap.data());
      }

      setLoading(false);
    };

    fetchRecord();
  }, [id]);

  if (loading) return <Text style={{ padding: 20 }}>Cargando...</Text>;
  if (!record) return <Text style={{ padding: 20 }}>Registro no encontrado</Text>;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        Detalle del estudio clínico
      </Text>

      <Text style={{ marginBottom: 8 }}>📄 Título: {record.title}</Text>
      <Text style={{ marginBottom: 8 }}>📊 Resultado: {record.result}</Text>
      <Text style={{ marginBottom: 8 }}>
        🗓️ Fecha: {formatDate(record.date || record.createdAt)}
      </Text>

      {record.doctor && (
        <Text style={{ marginBottom: 8 }}>👨‍⚕️ Solicitado por: {record.doctor}</Text>
      )}

      {record.notes && (
        <View style={{ marginTop: 20, padding: 16, backgroundColor: '#F5F5F5', borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>📝 Comentarios adicionales:</Text>
          <Text>{record.notes}</Text>
        </View>
      )}
    </View>
  );
}

function formatDate(value: string | { seconds: number }) {
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
    return 'Fecha desconocida';
  }
}
