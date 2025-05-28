import { auth, db } from '@/lib/firebase/firebaseConfig';
import { registerForPushNotificationsAsync } from '@/lib/notifications/registerPushToken';
import { Ionicons } from '@expo/vector-icons';
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
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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
      let retries = 0;
      while (!auth.currentUser?.uid && retries < 10) {
        await new Promise(res => setTimeout(res, 300));
        retries++;
      }
      if (auth.currentUser?.uid) {
        await registerForPushNotificationsAsync();
      }
    };

    waitForAuthAndRegister();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}>
      <Text style={styles.header}>Bienvenid@, Doctor</Text>

      <Section icon="calendar-outline" title="Citas del día">
        {loading ? (
          <ActivityIndicator size="large" color="#5A5CFF" />
        ) : appointments.length === 0 ? (
          <Text style={{ color: '#999' }}>No hay citas agendadas para hoy.</Text>
        ) : (
          appointments.map((a) => {
            const dateObj = a.date.toDate();
            const timeStr = dateObj.toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <Card
                key={a.id}
                title={`${timeStr} - ${a.patientName}`}
                subtitle={`Estado: ${a.status}`}
              />
            );
          })
        )}
      </Section>

      <Section icon="folder-open-outline" title="Historiales de pacientes">
        {patients.length === 0 ? (
          <Text style={{ color: '#999' }}>No hay pacientes registrados.</Text>
        ) : (
          patients.map((p) => (
            <TouchableOpacity key={p.id} onPress={() => router.push(`/(tabs)/doctor/records/${p.id}`)}>
              <Card title={p.name} subtitle="Ver historial clínico" />
            </TouchableOpacity>
          ))
        )}
      </Section>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/(tabs)/doctor/consultation')}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Agregar diagnóstico</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Ionicons name={icon as any} size={20} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Card({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <Text style={{ color: '#5A5CFF', fontWeight: 'bold', marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: '#333' }}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#5A5CFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
});
