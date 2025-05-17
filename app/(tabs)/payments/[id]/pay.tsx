import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PayScreen() {
  const { id } = useLocalSearchParams(); // paymentId
  const { user } = useAuth();
  const router = useRouter();

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startPayment = async () => {
      if (!id || typeof id !== 'string' || !user?.uid) return;

      try {
        const paymentDoc = await getDoc(doc(db, 'payments', id));
        if (!paymentDoc.exists()) {
          Alert.alert('Error', 'Pago no encontrado.');
          router.back();
          return;
        }

        const paymentData = paymentDoc.data();
        const amount = paymentData?.amount;

        if (!amount) {
          Alert.alert('Error', 'Monto no disponible en el pago.');
          router.back();
          return;
        }

        const functions = getFunctions(undefined, 'us-central1');
        const createCheckout = httpsCallable(functions, 'createCheckoutSession');
        const res: any = await createCheckout({
          amount,
          paymentId: id,
          patientId: user.uid,
        });

        setCheckoutUrl(res.data.url);
      } catch (error: any) {
        console.error('Error al crear sesión de pago:', error.message || error);
        Alert.alert('Error', 'No se pudo iniciar el pago.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    startPayment();
  }, [id, user]);

  if (loading || !checkoutUrl) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="card-outline" size={42} color="#5A5CFF" />
        <ActivityIndicator size="large" style={{ marginTop: 16 }} />
        <Text style={{ marginTop: 10 }}>Generando sesión de pago...</Text>
      </View>
    );
  }

  return <WebView source={{ uri: checkoutUrl }} />;
}
