import { resetPassword, signIn } from '@/lib/firebase/auth';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (value: string) => emailRegex.test(value.trim());

const normalizeEmail = (value: string) => value.trim().toLowerCase();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = password.trim();

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      Alert.alert('Error', 'Ingresa un correo válido');
      return;
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await signIn(normalizedEmail, trimmedPassword);
      router.replace('/');
    } catch (error: any) {
      let message = 'Error al iniciar sesión';

      if (error.code === 'auth/user-not-found') {
        message = 'Usuario no registrado';
      } else if (
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-login-credentials'
      ) {
        message = 'Correo o contraseña incorrectos';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Correo inválido';
      } else if (error.code === 'auth/too-many-requests') {
        message =
          'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Revisa tu conexión a internet e inténtalo de nuevo.';
      }

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      Alert.alert('Error', 'Por favor, ingresa tu correo primero');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Error', 'Ingresa un correo válido para recuperar tu contraseña');
      return;
    }

    resetPassword(normalizedEmail)
      .then(() => {
        Alert.alert(
          'Listo',
          'Se ha enviado un correo para restablecer tu contraseña'
        );
      })
      .catch((error: unknown) => {
        const code = (error as { code?: string }).code;
        let message = 'No se pudo enviar el correo';

        if (code === 'auth/invalid-email') {
          message = 'Correo inválido';
        } else if (code === 'auth/user-not-found') {
          message = 'No existe una cuenta con ese correo';
        } else if (code === 'auth/too-many-requests') {
          message =
            'Has solicitado demasiados correos de recuperación. Inténtalo más tarde.';
        } else if (code === 'auth/network-request-failed') {
          message = 'Revisa tu conexión a internet e inténtalo de nuevo.';
        }

        Alert.alert('Error', message);
      });
  };

  const trimmedEmailForDisabled = normalizeEmail(email);
  const resetDisabled =
    !trimmedEmailForDisabled || !isValidEmail(trimmedEmailForDisabled);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Image
            source={require('@/assets/medaccess-logo.png')}
            style={{ width: 120, height: 40, resizeMode: 'contain' }}
          />
        </View>

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
            style={{
              fontSize: 22,
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            Iniciar sesión
          </Text>

          <TextInput
            testID="email-input"
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
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
            testID="password-input"
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
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
            testID="forgot-password-button"
            disabled={resetDisabled}
            onPress={handleResetPassword}
          >
            <Text
              style={{
                color: resetDisabled ? '#B0B0B0' : '#5A5CFF',
                textAlign: 'right',
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <Pressable
            testID="login-button"
            onPress={handleLogin}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#A0A3FF' : '#5A5CFF',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </Text>
          </Pressable>

          <TouchableOpacity
            testID="go-register-button"
            onPress={() => router.push('/auth/register')}
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
          <TouchableOpacity onPress={() => router.push('/auth/help')}>
            <FontAwesome6 name="circle-info" size={24} color="#5A5CFF" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL('tel:+526242623907')}>
            <FontAwesome6 name="phone" size={24} color="#5A5CFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                'mailto:soporte@medaccess.com?subject=Ayuda%20con%20el%20acceso'
              )
            }
          >
            <FontAwesome6 name="envelope" size={24} color="#5A5CFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
