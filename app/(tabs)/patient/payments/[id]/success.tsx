import LoadingScreen from '@/components/ui/LoadingScreen';
import { db } from '@/lib/firebase/firebaseConfig';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

export default function StripeSuccessInternal() {
  const { id } = useLocalSearchParams(); // paymentId
  const router = useRouter();
  const [status, setStatus] = useState<'esperando' | 'redireccionando'>('esperando');

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const ref = doc(db, 'payments', id);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      if (data.status === 'pagado') {
        setStatus('redireccionando');
        setTimeout(() => {
          router.replace(`/(tabs)/patient/payments/${id}/review`);
        }, 1500);
      }
    });

    return () => unsubscribe();
  }, [id]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
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
