import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function RecordsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: { backgroundColor: '#5A5CFF' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* Lista de Records */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Historial Clínico',
        }}
      />

      {/* Detalle del Record */}
      <Stack.Screen
        name="[id]"
        options={({ navigation }) => ({
          title: 'Detalle',
          headerLeft: () => (
            <TouchableOpacity
              style={{ marginLeft: 12 }}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack>
  );
}
