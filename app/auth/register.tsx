import { auth, db } from '@/lib/firebase/firebaseConfig';
import { FontAwesome6 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{10}$/;

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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const name = form.name.trim();
    const lastname = form.lastname.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirm = form.confirm;
    const phone = form.phone.trim();
    const birthdate = form.birthdate;
    const curp = form.curp.trim().toUpperCase();
    const address = form.address.trim();
    const gender = form.gender;
    const allergies = form.allergies.trim();

    if (!name || name.length < 2) {
      Alert.alert('Error', 'Nombre es requerido');
      return;
    }
    if (!lastname || lastname.length < 2) {
      Alert.alert('Error', 'Apellido es requerido');
      return;
    }
    if (!email || !emailRegex.test(email)) {
      Alert.alert('Error', 'Correo inválido');
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    if (!phone || !phoneRegex.test(phone)) {
      Alert.alert('Error', 'Teléfono inválido (10 dígitos)');
      return;
    }
    if (!birthdate || new Date(birthdate) > new Date()) {
      Alert.alert('Error', 'Selecciona una fecha de nacimiento válida');
      return;
    }
    if (curp && curp.length !== 18) {
      Alert.alert('Error', 'La CURP debe tener 18 caracteres');
      return;
    }
    if (!address || address.length < 5) {
      Alert.alert('Error', 'Dirección es requerida');
      return;
    }
    if (!gender) {
      Alert.alert('Error', 'Selecciona un sexo');
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, 'patients', uid), {
        name,
        lastname,
        email,
        role: 'paciente',
        phone,
        birthdate,
        curp,
        address,
        gender,
        allergies,
        createdAt: new Date(),
      });

      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo completar el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <FontAwesome6 name="user-plus" size={48} color="#5A5CFF" />
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>Registro</Text>
        </View>

        {[
          { label: 'Nombre', key: 'name', placeholder: 'Ingrese su nombre' },
          { label: 'Apellido', key: 'lastname', placeholder: 'Ingrese su apellido' },
          {
            label: 'Correo',
            key: 'email',
            placeholder: 'Ingrese su correo',
            keyboardType: 'email-address',
          },
          {
            label: 'Contraseña',
            key: 'password',
            placeholder: 'Ingrese su contraseña',
            secure: true,
          },
          {
            label: 'Confirmar contraseña',
            key: 'confirm',
            placeholder: 'Ingrese su confirmar contraseña',
            secure: true,
          },
          {
            label: 'Teléfono',
            key: 'phone',
            placeholder: 'Ingrese su teléfono',
            keyboardType: 'phone-pad',
          },
          { label: 'CURP', key: 'curp', placeholder: 'Ingrese su curp' },
          { label: 'Dirección', key: 'address', placeholder: 'Ingrese su dirección' },
        ].map(({ label, key, keyboardType, secure, placeholder }) => (
          <View key={key} style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4 }}>{label}</Text>
            <TextInput
              value={form[key as keyof typeof form]}
              onChangeText={(value) => handleChange(key as keyof typeof form, value)}
              placeholder={placeholder}
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

        {/* Fecha de nacimiento */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ marginBottom: 4 }}>Fecha de nacimiento</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: '#F5F5F5',
              borderRadius: 8,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E0E0E0',
            }}
          >
            <Text style={{ color: form.birthdate ? '#000' : '#999' }}>
              {form.birthdate
                ? new Date(form.birthdate).toLocaleDateString('es-MX')
                : 'Selecciona una fecha'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={form.birthdate ? new Date(form.birthdate) : new Date()}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  handleChange('birthdate', selectedDate.toISOString());
                }
              }}
            />
          )}
        </View>

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
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#5A5CFF',
                    }}
                  />
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
          disabled={loading}
          style={{
            backgroundColor: loading ? '#A0A3FF' : '#5A5CFF',
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
