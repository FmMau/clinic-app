import { Stack } from 'expo-router';

export default function AppointmentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Mis Citas' }} />
      <Stack.Screen name="create" options={{ title: 'Nueva Cita' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalle de Cita' }} />
    </Stack>
  );
}
