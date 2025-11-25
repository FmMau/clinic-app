import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function PaymentsLayout() {
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
      {/* Lista de pagos */}
      <Stack.Screen
        name="index"
        options={{ title: 'Pagos' }}
      />

      {/* Detalle del pago */}
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalles del Pago' }}
      />

      {/* Valoración del servicio */}
      <Stack.Screen
        name="[id]/review"
        options={{ title: 'Valoración del Servicio' }}
      />

      {/* Pantalla de pagar */}
      <Stack.Screen
        name="[id]/pay"
        options={{
          title: '',
          headerBackVisible: true,
          headerLeft: ({ tintColor }) => (
            <TouchableOpacity onPress={() => history.back()} style={{ marginLeft: 12 }}>
              <Ionicons name="arrow-back-outline" size={24} color={tintColor} />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}
