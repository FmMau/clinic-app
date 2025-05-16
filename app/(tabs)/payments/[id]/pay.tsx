import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
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

        console.log('Llamando función con:', {
          amount,
          paymentId: id,
          patientId: user.uid,
        });

        const functions = getFunctions(undefined, 'us-central1');
        const createCheckout = httpsCallable(functions, 'createCheckoutSession');
        const res: any = await createCheckout({
          amount,
          paymentId: id,
          patientId: user.uid,
        });

        console.log('Respuesta Stripe:', res.data);
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <WebView source={{ uri: checkoutUrl }} />;
}
