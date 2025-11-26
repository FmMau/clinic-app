import LoadingScreen from '@/components/ui/LoadingScreen';
import { auth } from '@/lib/firebase/firebaseConfig';
import { useUserRole } from '@/lib/firebase/useUserRole';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { TouchableOpacity } from 'react-native';

export default function DoctorProfileLayout() {
  const router = useRouter();
  const { role, loading } = useUserRole();

  // Mientras carga el rol
  if (loading) {
    return <LoadingScreen message="Cargando perfil..." />;
  }

  // Si no es doctor, no debería estar aquí (puedes redirigir si quieres)
  if (role !== 'doctor') {
    return null;
    // o:
    // router.replace('/auth/login');
    // return null;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#5A5CFF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Perfil del doctor',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleLogout}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Editar perfil',
        }}
      />
    </Stack>
  );
}
