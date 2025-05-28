import { auth, db } from '@/lib/firebase/firebaseConfig';
import { useRouter } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import {
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CreateDoctorScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !specialty || !email || !phone) {
      Alert.alert('Faltan campos obligatorios');
      return;
    }

    setLoading(true);

    try {
      // 🔍 Verificar si el correo ya está registrado
      const existing = await fetchSignInMethodsForEmail(auth, email);
      if (existing.length > 0) {
        Alert.alert('Este correo ya está registrado.');
        setLoading(false);
        return;
      }

      // ✅ Crear usuario en Firebase Auth
      const password = 'default123';
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // 📥 Crear documento en "doctors"
      await addDoc(collection(db, 'doctors'), {
        userId,
        name,
        email,
        phone,
        specialty,
        location,
        coordinates: null,
        role: 'doctor',
        expoPushToken: null,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Médico registrado con éxito');
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error al registrar médico', err.message || '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Registrar Médico
      </Text>

      {[
        { label: 'Nombre completo', value: name, set: setName },
        { label: 'Especialidad', value: specialty, set: setSpecialty },
        { label: 'Correo electrónico', value: email, set: setEmail },
        { label: 'Teléfono', value: phone, set: setPhone },
        { label: 'Ubicación (opcional)', value: location, set: setLocation },
      ].map(({ label, value, set }, index) => (
        <View key={index} style={{ marginBottom: 14 }}>
          <Text style={{ fontWeight: '500', marginBottom: 6 }}>{label}</Text>
          <TextInput
            value={value}
            onChangeText={set}
            placeholder={label}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 8,
              padding: 12,
              backgroundColor: '#fff',
            }}
            autoCapitalize="none"
            keyboardType={label.includes('Correo') ? 'email-address' : 'default'}
          />
        </View>
      ))}

      <TouchableOpacity
        disabled={loading}
        onPress={handleSubmit}
        style={{
          backgroundColor: '#5A5CFF',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 16,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          {loading ? 'Guardando...' : 'Registrar Médico'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
