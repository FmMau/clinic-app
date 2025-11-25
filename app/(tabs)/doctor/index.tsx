import { auth, db } from '@/lib/firebase/firebaseConfig';
import { registerForPushNotificationsAsync } from '@/lib/notifications/registerPushToken';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Timestamp,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipos básicos
type Patient = {
  id: string;
  name?: string;
  [key: string]: any;
};

type Appointment = {
  id: string;
  date: Timestamp;
  doctorId: string;
  patientId: string;
  status: string;
  [key: string]: any;
};

export default function DoctorDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Carga de datos (hoy + pacientes) ---
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        setLoading(false);
        setError('No se encontró el usuario autenticado.');
        return;
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const patientsSnap = await getDocs(collection(db, 'patients'));

      const appointmentsSnap = await getDocs(
        query(
          collection(db, 'appointments'),
          where('date', '>=', Timestamp.fromDate(startOfDay)),
          where('date', '<=', Timestamp.fromDate(endOfDay)),
          where('doctorId', '==', userId)
        )
      );

      setPatients(
        patientsSnap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Patient)
        )
      );

      setAppointments(
        appointmentsSnap.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Appointment)
        )
      );
    } catch (e) {
      console.error('Error cargando dashboard del doctor', e);
      setError('Ocurrió un error al cargar la información.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Re-cargar al volver a enfocar el tab
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [fetchInitialData])
  );

  // Registro de push una sola vez, cuando ya hay usuario
  useEffect(() => {
    const waitForAuthAndRegister = async () => {
      let retries = 0;
      while (!auth.currentUser?.uid && retries < 10) {
        await new Promise((res) => setTimeout(res, 300));
        retries++;
      }
      if (auth.currentUser?.uid) {
        await registerForPushNotificationsAsync();
      }
    };

    waitForAuthAndRegister();
  }, []);

  // Map de pacientes por id para acceso rápido
  const patientMap = useMemo(
    () =>
      patients.reduce<Record<string, string>>((acc, patient) => {
        acc[patient.id] = patient.name || 'Paciente';
        return acc;
      }, {}),
    [patients]
  );

  // Pequeñas métricas del día
  const totalToday = appointments.length;
  const pendingToday = appointments.filter(
    (a) => a.status?.toLowerCase() === 'pendiente'
  ).length;
  const doneToday = appointments.filter(
    (a) => a.status?.toLowerCase() === 'completada'
  ).length;

  const handleOpenAppointment = (appointment: Appointment) => {
    // Puedes ajustar la ruta/params según tu pantalla de consulta
    router.push({
      pathname: '/(tabs)/doctor/consultation',
      params: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
      },
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}
    >
      <Text style={styles.header}>Bienvenid@, Doctor</Text>

      {/* Métricas del día */}
      <View style={styles.statsContainer}>
        <StatCard label="Citas hoy" value={totalToday} />
        <StatCard label="Pendientes" value={pendingToday} />
        <StatCard label="Completadas" value={doneToday} />
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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
            const patientName = patientMap[a.patientId] || 'Paciente';

            return (
              <TouchableOpacity
                key={a.id}
                onPress={() => handleOpenAppointment(a)}
              >
                <Card
                  title={`${timeStr} - ${patientName}`}
                  subtitle={`Estado: ${a.status}`}
                />
              </TouchableOpacity>
            );
          })
        )}
      </Section>

      <Section icon="folder-open-outline" title="Historiales de pacientes">
        {patients.length === 0 ? (
          <Text style={{ color: '#999' }}>No hay pacientes registrados.</Text>
        ) : (
          patients.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() =>
                router.push(`/(tabs)/doctor/records/${p.id}`)
              }
            >
              <Card title={p.name || 'Paciente'} subtitle="Ver historial clínico" />
            </TouchableOpacity>
          ))
        )}
      </Section>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push('/(tabs)/doctor/consultation')}
      >
        <Ionicons
          name="add-circle-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
          Agregar diagnóstico
        </Text>
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color="#5A5CFF"
          style={{ marginRight: 8 }}
        />
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Card({ title, subtitle }: { title: string; subtitle: string }) {
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
      <Text style={{ color: '#5A5CFF', fontWeight: 'bold', marginBottom: 4 }}>
        {title}
      </Text>
      <Text style={{ color: '#333' }}>{subtitle}</Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F4F5FF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5A5CFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#B00020',
    fontSize: 13,
  },
});
