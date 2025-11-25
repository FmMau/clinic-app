import LoadingScreen from '@/components/ui/LoadingScreen';
import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function StripeSuccessInternal() {
  const { id } = useLocalSearchParams(); // paymentId desde query
  const paymentId = Array.isArray(id) ? id[0] : id;

  const router = useRouter();
  const [status, setStatus] = useState<'esperando' | 'redireccionando'>(
    'esperando'
  );

  useEffect(() => {
    if (!paymentId || typeof paymentId !== 'string') return;

    let hasRedirected = false;

    const ref = doc(db, 'payments', paymentId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;

        const data = snap.data();
        if (data.status === 'pagado' && !hasRedirected) {
          hasRedirected = true;
          setStatus('redireccionando');

          setTimeout(() => {
            router.replace(
              `/(tabs)/patient/payments/${paymentId}/review`
            );
          }, 1500);
        }
      },
      (error) => {
        console.error('Error al escuchar estado de pago:', error);
      }
    );

    return () => unsubscribe();
  }, [paymentId, router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      }}
    >
      <LoadingScreen
        message={
          status === 'esperando'
            ? 'Confirmando el pago...'
            : 'Redirigiendo a valoración...'
        }
      />
    </View>
  );
}
