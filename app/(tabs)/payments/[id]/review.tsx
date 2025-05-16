import { db } from '@/lib/firebase/firebaseConfig';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PaymentAndReview() {
  const { id } = useLocalSearchParams(); // paymentId
  const router = useRouter();

  const [method, setMethod] = useState<string | null>(null);
  const [rating, setRating] = useState(4);
  const [comments, setComments] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

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
  }, [id]);

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
      router.push('/(tabs)/payments');
    } catch (error) {
      console.error('Error al actualizar:', error);
      Alert.alert('Error', 'No se pudo registrar el pago.');
    }
  };

  const renderStar = (index: number) => (
    <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
      <FontAwesome
        name={index < rating ? 'star' : 'star-o'}
        size={32}
        color={index < rating ? '#4F46E5' : '#ccc'}
      />
    </TouchableOpacity>
  );

  if (loading || amount === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Enviar</Text>
      </TouchableOpacity>
    </View>
  );
}
