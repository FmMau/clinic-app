import { auth, db } from '@/lib/firebase/firebaseConfig';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    birthdate: '',
    curp: '',
    address: '',
    gender: '',
    allergies: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10,15}$/;
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  
    // Validaciones
    if (!form.name || form.name.length < 2) {
      Alert.alert('Error', 'Nombre es requerido');
      return;
    }
  
    if (!form.lastname || form.lastname.length < 2) {
      Alert.alert('Error', 'Apellido es requerido');
      return;
    }
  
    if (!form.email || !emailRegex.test(form.email)) {
      Alert.alert('Error', 'Correo inválido');
      return;
    }
  
    if (!form.password || form.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
  
    if (form.password !== form.confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
  
    if (!form.phone || !phoneRegex.test(form.phone)) {
      Alert.alert('Error', 'Teléfono inválido');
      return;
    }
  
    if (!form.birthdate || !dateRegex.test(form.birthdate)) {
      Alert.alert('Error', 'Fecha de nacimiento inválida (usa DD/MM/YYYY)');
      return;
    }
  
    if (form.curp && form.curp.length < 10) {
      Alert.alert('Error', 'CURP debe tener al menos 10 caracteres');
      return;
    }
  
    if (!form.address || form.address.length < 5) {
      Alert.alert('Error', 'Dirección es requerida');
      return;
    }
  
    if (!form.gender) {
      Alert.alert('Error', 'Selecciona un sexo');
      return;
    }
  
    // Registro en Firebase
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCred.user.uid;
  
      await setDoc(doc(db, 'patients', uid), {
        name: form.name,
        lastname: form.lastname,
        email: form.email,
        role: 'paciente',
        phone: form.phone,
        birthdate: form.birthdate,
        curp: form.curp,
        address: form.address,
        gender: form.gender,
        allergies: form.allergies,
        createdAt: new Date(),
      });
  
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48}}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <FontAwesome6 name="user-plus" size={48} color="#5A5CFF" />
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>Registro</Text>
        </View>

        {[
          { label: 'Nombre', key: 'name' },
          { label: 'Apellido', key: 'lastname' },
          { label: 'Correo', key: 'email', keyboardType: 'email-address' },
          { label: 'Contraseña', key: 'password', secure: true },
          { label: 'Confirmar contraseña', key: 'confirm', secure: true },
          { label: 'Teléfono', key: 'phone', keyboardType: 'phone-pad' },
          { label: 'Fecha de nacimiento', key: 'birthdate', placeholder: 'DD/MM/YYYY' },
          { label: 'CURP', key: 'curp' },
          { label: 'Dirección', key: 'address' },
        ].map(({ label, key, keyboardType, secure, placeholder }) => (
          <View key={key} style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4 }}>{label}</Text>
            <TextInput
              value={form[key as keyof typeof form]}
              onChangeText={(value) => handleChange(key as keyof typeof form, value)}
              placeholder={placeholder || `Ingrese su ${label.toLowerCase()}`}
              placeholderTextColor="#999"
              secureTextEntry={secure}
              keyboardType={keyboardType as any}
              style={{
                backgroundColor: '#F5F5F5',
                borderRadius: 8,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E0E0E0',
              }}
            />
          </View>
        ))}

        {/* Sexo */}
        <Text style={{ marginBottom: 4 }}>Sexo</Text>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {['Masculino', 'Femenino'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => handleChange('gender', g)}
              style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}
            >
              <View
                style={{
                  height: 16,
                  width: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#5A5CFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 6,
                }}
              >
                {form.gender === g && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#5A5CFF' }} />
                )}
              </View>
              <Text>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alergias */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ marginBottom: 4 }}>Alergias (opcional)</Text>
          <TextInput
            value={form.allergies}
            onChangeText={(value) => handleChange('allergies', value)}
            placeholder="Ingrese alergias si hay"
            placeholderTextColor="#999"
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E0E0E0',
            }}
          />
        </View>

        <Pressable
          onPress={handleRegister}
          style={{
            backgroundColor: '#5A5CFF',
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {loading ? 'Registrando...' : 'Registrar'}
          </Text>
        </Pressable>

        <TouchableOpacity onPress={() => router.replace('/auth/login')}>
          <Text
            style={{
              marginTop: 20,
              textAlign: 'center',
              color: '#5A5CFF',
              fontWeight: '500',
              fontSize: 14,
            }}
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
