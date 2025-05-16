import { Stack } from 'expo-router';

export default function AppointmentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: {
            backgroundColor: '#5A5CFF', // Replace with your desired background color
          },
        headerTintColor: '#FFFFFF', // Set the back button color to white
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Citas' }} />
      <Stack.Screen name="create" options={{ title: 'Agendar cita' }} />
      <Stack.Screen name="[id]" options={{ title: 'Detalles' }} />
    </Stack>
  );
}
