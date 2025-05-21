import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PaymentAndReview() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const { id } = useLocalSearchParams(); // paymentId
  const router = useRouter();

  const [method, setMethod] = useState<string | null>(null);
  const [rating, setRating] = useState(4);
  const [comments, setComments] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string' || !allowed) return;

    const fetchPayment = async () => {
      const docSnap = await getDoc(doc(db, 'payments', id));
      if (!docSnap.exists()) {
        Alert.alert('Error', 'Pago no encontrado');
        router.back();
        return;
      }

      const data = docSnap.data();
      setAmount(data.amount);
      setLoading(false);
    };

    fetchPayment();
  }, [id, allowed]);

  const handleSubmit = async () => {
    if (!method) {
      Alert.alert('Error', 'Por favor selecciona un método de pago.');
      return;
    }

    try {
      const docRef = doc(db, 'payments', id as string);
      await updateDoc(docRef, {
        method,
        rating,
        comments,
        status: 'pagado',
      });

      Alert.alert('Gracias', 'Tu pago y valoración han sido registrados.');
      router.push('/(tabs)/patient/payments');
    } catch (error) {
      console.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudo registrar el pago.');
    }
  };

  const renderStar = (index: number) => (
    <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
      <Ionicons
        name={index < rating ? 'star' : 'star-outline'}
        size={32}
        color={index < rating ? '#4F46E5' : '#ccc'}
      />
    </TouchableOpacity>
  );

  if (guardLoading || loading || amount === null) {
    return <LoadingScreen message="Cargando pago y valoración..." />;
  }

  if (!allowed) return null;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        Pagos y Valoraciones
      </Text>

      <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Total pagado</Text>
      <View
        style={{
          backgroundColor: '#eee',
          padding: 16,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 18 }}>${amount.toFixed(2)}</Text>
      </View>

      <Text style={{ fontWeight: 'bold', marginVertical: 16 }}>
        Calificación del médico
      </Text>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {[...Array(5)].map((_, i) => renderStar(i))}
      </View>

      <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Comentarios</Text>
      <TextInput
        placeholder="Escribe tus comentarios aquí..."
        multiline
        numberOfLines={4}
        value={comments}
        onChangeText={setComments}
        style={{
          borderColor: '#ccc',
          borderWidth: 1,
          borderRadius: 10,
          padding: 10,
          marginBottom: 20,
        }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        style={{
          backgroundColor: '#4F46E5',
          padding: 16,
          borderRadius: 10,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="checkmark-outline" size={20} color="#fff" style={{ marginRight: 6 }} />
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}
