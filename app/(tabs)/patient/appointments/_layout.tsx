import { db } from '@/lib/firebase/firebaseConfig';
import { useUserRole } from '@/lib/firebase/useUserRole';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc } from 'firebase/firestore';
import { Alert, TouchableOpacity, View } from 'react-native';

export default function AppointmentsLayout() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { role } = useUserRole();

  const handleDelete = async () => {
    Alert.alert('Eliminar cita', '¿Deseas eliminar esta cita permanentemente?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'appointments', String(id)));
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

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: {
          backgroundColor: '#5A5CFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Listado de citas */}
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

      {/* Formulario de creación */}
      <Stack.Screen
        name="create"
        options={{
          title: 'Agendar cita',
        }}
      />

      {/* Detalle de cita */}
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Detalles',
          headerRight: () =>
            role === 'paciente' && (
              <View style={{ flexDirection: 'row', gap: 12, marginRight: 12 }}>
                <TouchableOpacity onPress={() => router.push(`/(tabs)/patient/appointments/${id}/edit`)}>
                  <Ionicons name="create-outline" size={22} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            ),
        }}
      />

      {/* Edición */}
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar cita',
        }}
      />
    </Stack>
  );
}
