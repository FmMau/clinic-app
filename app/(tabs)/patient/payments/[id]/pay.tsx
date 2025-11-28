import LoadingScreen from '@/components/ui/LoadingScreen';
import { useAuth } from '@/hooks/useAuth';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PayScreen() {
  const { loading: guardLoading, allowed } = useRoleGuard(['paciente']);
  const { id } = useLocalSearchParams(); // paymentId
  const paymentId = Array.isArray(id) ? id[0] : id;

  const { user } = useAuth();
  const router = useRouter();

  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startPayment = async () => {
      if (!allowed || !paymentId || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
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
          paymentId,
          patientId: user.uid,
        });

        setCheckoutUrl(res.data.url);
      } catch (error: any) {
        console.error('Error al crear sesión de pago:', error?.message || error);
        Alert.alert('Error', 'No se pudo iniciar el pago.');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    startPayment();
  }, [allowed, paymentId, user?.uid, router]);

  if (guardLoading) {
    return <LoadingScreen message="Verificando permisos..." />;
  }

  if (!allowed) return null;

  if (loading || !checkoutUrl) {
    return <LoadingScreen message="Generando sesión de pago..." />;
  }

  return (
    <WebView
      source={{ uri: checkoutUrl }}
      startInLoadingState
      javaScriptEnabled
      domStorageEnabled
      allowsBackForwardNavigationGestures={false}
      onNavigationStateChange={(navState) => {
        if (navState.url.includes('https://medaccess.com/stripe-success')) {
          try {
            const url = new URL(navState.url);
            const paidId = url.searchParams.get('paymentId') || paymentId;
            if (paidId) {
              router.replace(`/(tabs)/patient/payments/${paidId}/review`);
            }
          } catch (err) {
            console.error('Error parseando URL de éxito:', err);
          }
        }
      }}
    />
  );
}
