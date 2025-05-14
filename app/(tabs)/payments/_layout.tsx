import { Stack } from 'expo-router';

export default function PaymentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Detalle de Pago' }} />
    </Stack>
  );
}
