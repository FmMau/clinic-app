import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AdminDashboard() {
  const router = useRouter();

  const [activeUsers, setActiveUsers] = useState(0);
  const [newUsersToday, setNewUsersToday] = useState(0);
  const [appointmentsToday, setAppointmentsToday] = useState<any[]>([]);
  const [servicesCount, setServicesCount] = useState(0);
  const [uniquePatients, setUniquePatients] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(todayStart);

      const usersSnap = await getDocs(collection(db, 'users'));
      let active = 0;
      let newToday = 0;

      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.active) active++;
        const created = data.createdAt?.toDate();
        if (created && created >= todayStart) newToday++;
      });

      setActiveUsers(active);
      setNewUsersToday(newToday);

      const appointmentsSnap = await getDocs(
        query(collection(db, 'appointments'), where('date', '>=', todayTimestamp))
      );

      const todayAppointments: any[] = [];
      const services = new Set();
      const patients = new Set();

      appointmentsSnap.forEach((doc) => {
        const data = doc.data();
        const date = data.date?.toDate();
        if (date && date.toDateString() === todayStart.toDateString()) {
          todayAppointments.push(data);
          if (data.service) services.add(data.service);
          if (data.patientId) patients.add(data.patientId);
        }
      });

      setAppointmentsToday(todayAppointments);
      setServicesCount(services.size);
      setUniquePatients(patients.size);
    };

    fetchDashboardData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="stats-chart-outline" size={22} color="#5A5CFF" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Panel del Administrador</Text>
      </View>

      <Card
        title="Resumen de servicios diarios"
        description={`Hoy se atenderán ${uniquePatients} pacientes con ${servicesCount} servicios médicos.`}
      />

      <Card title="Agenda médica completa">
        {appointmentsToday.length === 0 ? (
          <Text style={styles.empty}>No hay citas para hoy</Text>
        ) : (
          appointmentsToday.map((appt, i) => (
            <Text key={i} style={styles.appointment}>
              {new Date(appt.date.toDate()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })} – {appt.doctor} – {appt.service}
            </Text>
          ))
        )}
      </Card>

      <Card title="Control de usuarios">
        <Text style={styles.info}>Usuarios activos: {activeUsers}</Text>
        <Text style={styles.info}>Nuevos registros hoy: {newUsersToday}</Text>
      </Card>

      <Card
        title="Reportes y estadísticas"
        onPress={() => router.push('/admin/reports')}
        icon="pie-chart-outline"
      />
    </ScrollView>
  );
}

function Card({ title, description, children, onPress, icon }: any) {
  const content = (
    <View style={{ padding: 16 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 6 }}>{title}</Text>
      {description && <Text style={{ marginBottom: 10, color: '#333' }}>{description}</Text>}
      {children}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.card}
    >
      {icon && (
        <View style={{ position: 'absolute', top: 16, right: 16 }}>
          <Ionicons name={icon} size={24} color="#5A5CFF" />
        </View>
      )}
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  appointment: {
    color: '#333',
    marginBottom: 4,
  },
  info: {
    color: '#333',
    marginBottom: 4,
  },
  empty: {
    color: '#888',
    fontStyle: 'italic',
  },
});
