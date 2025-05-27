import { auth, db } from '@/lib/firebase/firebaseConfig';
import { registerForPushNotificationsAsync } from '@/lib/notifications/registerPushToken';
import { useRouter } from 'expo-router';
import {
  Timestamp,
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DoctorDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const patientSnap = await getDocs(collection(db, 'patients'));
      const appointmentSnap = await getDocs(
        query(
          collection(db, 'appointments'),
          where('date', '>=', Timestamp.fromDate(startOfDay)),
          where('date', '<=', Timestamp.fromDate(endOfDay)),
          where('doctorId', '==', userId)
        )
      );

      setPatients(patientSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setAppointments(appointmentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const waitForAuthAndRegister = async () => {
      const maxRetries = 10;
      let retries = 0;
      let uid = auth.currentUser?.uid;

      while (!uid && retries < maxRetries) {
        await new Promise(res => setTimeout(res, 300));
        uid = auth.currentUser?.uid;
        retries++;
      }

      if (uid) {
        console.log('✅ UID disponible. Registrando notificaciones push...');
        await registerForPushNotificationsAsync();
      } else {
        console.warn('❌ UID no disponible después de reintentos');
      }
    };

    waitForAuthAndRegister();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        ListHeaderComponent={
          <View style={{ padding: 24, gap: 24 }}>
            <Text style={styles.title}>Citas del día</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#5A5CFF" />
            ) : appointments.length === 0 ? (
              <Text style={{ color: '#999' }}>No hay citas agendadas para hoy.</Text>
            ) : (
              <View style={styles.card}>
                {appointments.map((a) => {
                  const dateObj = a.date.toDate();
                  const timeStr = dateObj.toLocaleTimeString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View key={a.id} style={styles.row}>
                      <Text>{timeStr} - {a.patientName}</Text>
                      <Text style={{ color: '#5A5CFF' }}>{a.status}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={styles.title}>Acceso rápido al historial del paciente</Text>
            <View style={styles.card}>
              {patients.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text>{p.name}</Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/(tabs)/doctor/records/${p.id}`)}
                    style={styles.secondaryButton}
                  >
                    <Text style={{ color: '#fff' }}>Ver Historial</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.button, { alignSelf: 'center', paddingHorizontal: 24 }]}
              onPress={() => router.push('/(tabs)/doctor/consultation')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Agregar diagnóstico</Text>
            </TouchableOpacity>
          </View>
        }
        data={[]} // sin notificaciones
        renderItem={null}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#5A5CFF',
    paddingVertical: 12,
    borderRadius: 12,
  },
  secondaryButton: {
    backgroundColor: '#5A5CFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
});