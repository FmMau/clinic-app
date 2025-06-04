import { useUserRole } from '@/lib/firebase/useUserRole';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function TabsIndexRedirect() {
  const router = useRouter();
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading) {
      if (role === 'paciente') {
        router.replace('/(tabs)/patient');
      } else if (role === 'doctor') {
        router.replace('/(tabs)/doctor');
      } else if (role === 'admin') {
        router.replace('/(tabs)/admin');
      } else {
        router.replace('/auth/login');
      }
    }
  }, [role, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Redireccionando...</Text>
    </View>
  );
}
