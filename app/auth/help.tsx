import { Stack, useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export default function HelpScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Ayuda' }} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}
      style={{ backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>¿Tienes problemas?</Text>
        <Text style={{ marginBottom: 8 }}>
          1. Verifica que tu correo esté bien escrito.
        </Text>
        <Text style={{ marginBottom: 8 }}>
          2. La contraseña debe tener al menos 6 caracteres.
        </Text>
        <Text style={{ marginBottom: 8 }}>
          3. Si olvidaste tu contraseña, pronto podrás recuperarla desde el enlace.
        </Text>
        <Text style={{ marginTop: 16, marginBottom: 24 }}>
          También puedes contactarnos por teléfono o correo si necesitas asistencia personalizada.
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            alignSelf: 'center',
            backgroundColor: '#5A5CFF',
            paddingVertical: 10,
            paddingHorizontal: 24,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
