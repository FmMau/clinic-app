// app/auth/register-doctor.tsx
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { FontAwesome6 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
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
const CURP_REGEX = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const isValidEmail = (value: string) => emailRegex.test(normalizeEmail(value));
const normalizePhone = (value: string) => (value || '').replace(/\D/g, '');

function parseBirthdate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function isValidAge(date: Date): boolean {
  const today = new Date();
  if (date > today) return false;

  const age =
    today.getFullYear() -
    date.getFullYear() -
    (today <
    new Date(
      today.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
      ? 1
      : 0);

  // Para doctor podemos exigir al menos 18 años
  return age >= 18 && age <= 120;
}

function isValidCURP(value: string): boolean {
  if (!value) return false;
  return CURP_REGEX.test(value.trim().toUpperCase());
}

export default function RegisterDoctorScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    lastname: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    specialty: '',
    birthdate: '',
    curp: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const name = form.name.trim();
    const lastname = form.lastname.trim();
    const email = normalizeEmail(form.email);
    const password = form.password;
    const confirm = form.confirm;
    const phoneDigits = normalizePhone(form.phone);
    const specialty = form.specialty.trim();
    const birthdateRaw = form.birthdate;
    const curpClean = form.curp.trim().toUpperCase();

    // Nombre
    if (!name || name.length < 2) {
      Alert.alert('Error', 'El nombre es obligatorio (mínimo 2 caracteres).');
      return;
    }

    if (!lastname || lastname.length < 2) {
      Alert.alert('Error', 'El apellido es obligatorio (mínimo 2 caracteres).');
      return;
    }

    // Email
    if (!email || !isValidEmail(email)) {
      Alert.alert('Error', 'Correo inválido');
      return;
    }

    // Contraseña
    if (!password || password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    // Teléfono
    if (phoneDigits.length !== 10) {
      Alert.alert('Error', 'Teléfono inválido (debe tener 10 dígitos)');
      return;
    }

    // Especialidad
    if (!specialty || specialty.length < 3) {
      Alert.alert(
        'Error',
        'La especialidad es obligatoria (mínimo 3 caracteres).'
      );
      return;
    }

    // Fecha de nacimiento (opcional, pero si se llena, valida)
    let birthdateIso: string | null = null;
    if (birthdateRaw) {
      const birthdateDate = parseBirthdate(birthdateRaw);
      if (!birthdateDate) {
        Alert.alert('Error', 'Selecciona una fecha de nacimiento válida');
        return;
      }
      if (!isValidAge(birthdateDate)) {
        Alert.alert(
          'Error',
          'La fecha de nacimiento no es coherente. Verifica el año.'
        );
        return;
      }
      birthdateIso = birthdateDate.toISOString();
    }

    // CURP (opcional, pero si la llena, que sea válida)
    if (curpClean && !isValidCURP(curpClean)) {
      Alert.alert(
        'Error',
        'La CURP no tiene un formato válido (18 caracteres con estructura correcta).'
      );
      return;
    }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, 'doctors', uid), {
        name,
        lastname,
        email,
        role: 'doctor',
        phone: phoneDigits,
        specialty,
        birthdate: birthdateIso,
        curp: curpClean || null,
        photoURL: null,
        location: null,
        createdAt: serverTimestamp(),
      });

      router.replace('/');
    } catch (error: any) {
      let message = 'No se pudo completar el registro';

      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo ya está registrado.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Correo inválido.';
      } else if (error.code === 'auth/weak-password') {
        message = 'La contraseña es demasiado débil.';
      }

      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const birthdateLabel = form.birthdate
    ? new Date(form.birthdate).toLocaleDateString('es-MX')
    : 'Selecciona una fecha';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#fff' }}
    >
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <FontAwesome6 name="user-doctor" size={48} color="#5A5CFF" />
          <Text style={{ fontSize: 22, fontWeight: 'bold', marginTop: 8 }}>
            Registro de doctor
          </Text>
        </View>

        {[
          { label: 'Nombre', key: 'name', placeholder: 'Ingrese su nombre' },
          { label: 'Apellido', key: 'lastname', placeholder: 'Ingrese su apellido' },
          {
            label: 'Correo',
            key: 'email',
            placeholder: 'Ingrese su correo',
            keyboardType: 'email-address',
            autoCapitalize: 'none',
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
            placeholder: 'Confirme su contraseña',
            secure: true,
          },
          {
            label: 'Teléfono',
            key: 'phone',
            placeholder: 'Ingrese su teléfono',
            keyboardType: 'phone-pad',
          },
          {
            label: 'Especialidad',
            key: 'specialty',
            placeholder: 'Ej. Medicina interna',
          },
          {
            label: 'CURP (opcional)',
            key: 'curp',
            placeholder: 'Ingrese su CURP',
          },
        ].map(({ label, key, keyboardType, secure, placeholder, autoCapitalize }) => (
          <View key={key} style={{ marginBottom: 12 }}>
            <Text style={{ marginBottom: 4 }}>{label}</Text>
            <TextInput
              value={form[key as keyof typeof form]}
              onChangeText={(value) => handleChange(key as keyof typeof form, value)}
              placeholder={placeholder}
              placeholderTextColor="#999"
              secureTextEntry={secure}
              keyboardType={keyboardType as any}
              autoCapitalize={autoCapitalize as any}
              autoCorrect={key === 'email' ? false : undefined}
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
              {birthdateLabel}
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

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#A0A3FF' : '#5A5CFF',
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {loading ? 'Registrando...' : 'Registrar doctor'}
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
