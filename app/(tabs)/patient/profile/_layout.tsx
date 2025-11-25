import { auth } from '@/lib/firebase/firebaseConfig';
import { useUserRole } from '@/lib/firebase/useUserRole';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { TouchableOpacity } from 'react-native';

export default function PatientLayout() {
  const router = useRouter();
  const { role, loading } = useUserRole();

  if (loading) return null;

  // Seguridad: si no es paciente, no deja usar este layout
  if (role !== 'paciente') return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: '#5A5CFF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Perfil del paciente',
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
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
