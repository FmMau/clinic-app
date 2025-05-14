import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#5A5CFF', // Replace with your desired background color
        },
        headerTintColor: '#333', // Replace with your desired text/icon color
      }}
    >
      <Stack.Screen name="index" options={{ title: '' }} />
    </Stack>
  );
}