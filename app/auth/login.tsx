import { signIn } from '@/lib/firebase/auth';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';


export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F5F9FF' }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <FontAwesome6 name="user-doctor" size={64} color="#2F80ED" />
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginTop: 16 }}>
            Bienvenido Doctor
        </Text>
        </View>

      <Text style={{ fontSize: 16, marginBottom: 4 }}>Correo electrónico</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="doctor@clinica.com"
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: '#ccc',
        }}
      />

      <Text style={{ fontSize: 16, marginBottom: 4 }}>Contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        style={{
          backgroundColor: 'white',
          borderRadius: 10,
          padding: 12,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: '#ccc',
        }}
      />

      <Pressable
        onPress={handleLogin}
        style={{
          backgroundColor: '#2F80ED',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </Text>
      </Pressable>

      <Text style={{ marginTop: 20, textAlign: 'center', color: '#777' }}>
        ¿Olvidaste tu contraseña?
      </Text>
    </View>
  );
}