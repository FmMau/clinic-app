import { signIn } from '@/lib/firebase/auth';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    console.log('Intentando iniciar sesión...');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!email || !emailRegex.test(email)) {
      console.log('Correo inválido');
      Alert.alert('Error', 'Ingresa un correo válido');
      return;
    }
  
    if (!password || password.length < 6) {
      console.log('Contraseña inválida');
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
  
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (error: any) {
      console.log('Firebase error:', error);
      let message = 'Error al iniciar sesión';
  
      if (error.code === 'auth/user-not-found') {
        message = 'Usuario no registrado';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
        message = 'Correo o contraseña incorrectos';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Correo inválido';
      }
      
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };
  
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        {/* Logo */}
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Image
            source={require('@/assets/medaccess-logo.png')}
            style={{ width: 120, height: 40, resizeMode: 'contain' }}
          />
        </View>

        {/* Card Login */}
        <View
          style={{
            backgroundColor: '#fff',
            marginHorizontal: 24,
            borderRadius: 12,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <Text
            style={{ fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 }}
          >
            Acceso
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E0E0E0',
            }}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#E0E0E0',
            }}
          />

          <TouchableOpacity
            onPress={() => Alert.alert('¿Olvidaste tu contraseña?', 'Función por implementar')}
          >
            <Text
              style={{
                color: '#5A5CFF',
                textAlign: 'right',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#A0A3FF' : '#5A5CFF',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Text>
          </Pressable>


          <TouchableOpacity
            onPress={() => router.push('/auth/register')} // Ajusta si la ruta es distinta
          >
            <Text
              style={{
                marginTop: 20,
                textAlign: 'center',
                color: '#5A5CFF',
                fontWeight: '500',
                fontSize: 14,
              }}
            >
              ¿No tienes cuenta? Regístrate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer con íconos */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: 16,
            borderTopWidth: 1,
            borderColor: '#eee',
          }}
        >
          <FontAwesome6 name="circle-info" size={24} color="#5A5CFF" />
          <FontAwesome6 name="phone" size={24} color="#5A5CFF" />
          <FontAwesome6 name="envelope" size={24} color="#5A5CFF" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
