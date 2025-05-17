import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc } from 'firebase/firestore';
import { Alert, TouchableOpacity, View } from 'react-native';

export default function AppointmentsLayout() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const handleDelete = async () => {
    Alert.alert('Eliminar cita', '¿Deseas eliminar esta cita permanentemente?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'appointments', String(id)));
            Alert.alert('Cita eliminada');
            router.replace('/appointments');
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
      {/* Pantalla principal */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Citas',
          headerRight: () => (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              onPress={() => router.push('/appointments/create')}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Formulario de agendar */}
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
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12, marginRight: 12 }}>
              <TouchableOpacity onPress={() => router.push(`/appointments/${id}/edit`)}>
                <Ionicons name="create-outline" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Edición de cita */}
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Editar cita',
        }}
      />
    </Stack>
  );
}
