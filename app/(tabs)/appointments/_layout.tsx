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
      }}
    >
      <Stack.Screen name="index" options={{ title: '' }} />
      <Stack.Screen name="create" options={{ title: '' }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
