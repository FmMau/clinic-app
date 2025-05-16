import { Stack } from 'expo-router';

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
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Pagos' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalles del pago' }} />
      <Stack.Screen name="[id]/review" options={{ title: 'Valoración' }} />
      <Stack.Screen name="[id]/pay" options={{ title: 'Pagar' }} />
    </Stack>
  );
}
