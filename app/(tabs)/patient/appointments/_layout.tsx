import { db } from '@/lib/firebase/firebaseConfig';
import { useUserRole } from '@/lib/firebase/useUserRole';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc } from 'firebase/firestore';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';

export default function AppointmentsLayout() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { role, loading } = useUserRole();

  // id puede venir como string o string[]
  const idParam = Array.isArray(id) ? id[0] : id;

  const handleDelete = async () => {
    if (!idParam) return;

    Alert.alert('Eliminar cita', '¿Deseas eliminar esta cita permanentemente?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'appointments', String(idParam)));
            Alert.alert('Cita eliminada');
            router.replace('/(tabs)/patient/appointments');
          } catch (error) {
            Alert.alert('Error', 'No se pudo eliminar la cita.');
            console.error(error);
          }
        },
      },
    ]);
  };

  // Mientras carga el rol, opcionalmente mostramos un mini loader en el header
  if (loading) {
    return (
      <Stack
        screenOptions={{
          headerShown: true,
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: '#5A5CFF' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Citas',
            headerRight: () => (
              <ActivityIndicator style={{ marginRight: 16 }} color="#fff" />
            ),
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: '#5A5CFF' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Citas',
          headerRight: () =>
            role === 'paciente' && (
              <TouchableOpacity
                style={{ marginRight: 16 }}
                onPress={() => router.push('/(tabs)/patient/appointments/create')}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            ),
        }}
      />

      <Stack.Screen
        name="create"
        options={{ title: 'Agendar cita' }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/patient/appointments')}
              style={{ paddingLeft: 16 }}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
          headerRight: () =>
            role === 'paciente' && idParam && (
              <View style={{ flexDirection: 'row', gap: 16, marginRight: 12 }}>
                <TouchableOpacity
                  onPress={() =>
                    router.push(`/(tabs)/patient/appointments/${idParam}/edit`)
                  }
                >
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            ),
        }}
      />

      <Stack.Screen
        name="[id]/edit"
        options={{ title: 'Editar cita' }}
      />
    </Stack>
  );
}
