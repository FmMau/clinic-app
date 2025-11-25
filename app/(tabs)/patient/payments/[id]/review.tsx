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
  const paymentId = Array.isArray(id) ? id[0] : id;

  const router = useRouter();

  const [method, setMethod] = useState<string | null>(null);
  const [rating, setRating] = useState(4);
  const [comments, setComments] = useState('');
  const [amount, setAmount] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  // Cargar datos del pago
  useEffect(() => {
    const fetchPayment = async () => {
      if (!allowed || !paymentId) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'payments', paymentId));
        if (!snap.exists()) {
          Alert.alert('Error', 'Pago no encontrado');
          router.back();
          return;
        }

        const data = snap.data();

        if (data.status !== 'pagado') {
          Alert.alert('Error', 'Este pago aún no ha sido completado.');
          router.replace(`/(tabs)/patient/payments/${paymentId}/pay`);
          return;
        }

        setAmount(data.amount);
      } catch (err) {
        console.error('Error obteniendo pago:', err);
        Alert.alert('Error', 'No fue posible cargar el pago.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [allowed, paymentId]);

  // Enviar valoración
  const handleSubmit = async () => {
    try {
      if (!paymentId) return;

      if (!method) {
        Alert.alert('Error', 'Selecciona un método de pago.');
        return;
      }

      const ref = doc(db, 'payments', paymentId);

      await updateDoc(ref, {
        method,
        rating,
        comments: comments.trim(),
      });

      Alert.alert('Gracias', 'Tu valoración ha sido registrada.');
      router.push('/(tabs)/patient/payments');
    } catch (err) {
      console.error('Error al guardar valoración:', err);
      Alert.alert('Error', 'No se pudo guardar la valoración.');
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

  // Loading: permisos o cargo del pago
  if (guardLoading || loading || amount === null) {
    return <LoadingScreen message="Cargando pago y valoración..." />;
  }

  if (!allowed) return null;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
        Pagos y Valoraciones
      </Text>

      {/* Monto pagado */}
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

      {/* Estrellas */}
      <Text style={{ fontWeight: 'bold', marginVertical: 16 }}>
        Calificación del médico
      </Text>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {[...Array(5)].map((_, i) => renderStar(i))}
      </View>

      {/* Método de pago */}
      <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>
        Método de Pago usado
      </Text>

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => setMethod('Tarjeta')}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: method === 'Tarjeta' ? '#4F46E5' : '#ccc',
            backgroundColor: method === 'Tarjeta' ? '#E8E9FF' : '#fff',
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>Tarjeta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMethod('Efectivo')}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: method === 'Efectivo' ? '#4F46E5' : '#ccc',
            backgroundColor: method === 'Efectivo' ? '#E8E9FF' : '#fff',
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>Efectivo</Text>
        </TouchableOpacity>
      </View>

      {/* Comentarios */}
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
