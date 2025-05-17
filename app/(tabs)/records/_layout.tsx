import { Stack } from 'expo-router';

export default function RecordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Historial Clínico' }} />
    </Stack>
  );
}
