import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PatientDashboard() {
  const { loading, allowed } = useRoleGuard(['paciente']);
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid || !allowed) return;

    const unsubscribeAppointments = onSnapshot(
      query(
        collection(db, 'appointments'),
        where('patientId', '==', uid),
        orderBy('date', 'desc')
      ),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAppointments(data.slice(0, 2));
      }
    );

    const unsubscribeRecords = onSnapshot(
      query(
        collection(db, 'medicalRecords'),
        where('patientId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecords(data.slice(0, 2));
      }
    );

    const unsubscribePayments = onSnapshot(
      query(
        collection(db, 'payments'),
        where('patientId', '==', uid),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPayments(data.slice(0, 2));
      }
    );

    return () => {
      unsubscribeAppointments();
      unsubscribeRecords();
      unsubscribePayments();
    };
  }, [uid, allowed]);

  if (loading) return <LoadingScreen message="Cargando panel del paciente..." />;
  if (!allowed) return null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Bienvenid@, Paciente
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/(tabs)/patient/appointments/create')}
        style={{
          backgroundColor: '#5A5CFF',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Agendar nueva cita</Text>
      </TouchableOpacity>

      <Section icon="calendar-outline" title="Próximas Citas">
        {appointments.length === 0 ? (
          <Text style={{ color: '#999' }}>No tienes citas agendadas.</Text>
        ) : (
          appointments.map((a) => (
            <TouchableOpacity key={a.id} onPress={() => router.push(`/(tabs)/patient/appointments/${a.id}`)}>
              <Card
                title={a.doctor || 'Consulta médica'}
                subtitle={a.date?.toDate ? formatDate(a.date.toDate()) : 'Sin fecha'}
              />
            </TouchableOpacity>
          ))
        )}
      </Section>

      <Section icon="medkit-outline" title="Historial Clínico">
        {records.length === 0 ? (
          <Text style={{ color: '#999' }}>No hay historial disponible.</Text>
        ) : (
          records.map((r) => (
            <TouchableOpacity key={r.id} onPress={() => router.push(`/(tabs)/patient/records/${r.id}`)}>
              <Card
                title={r.diagnosis || 'Consulta sin diagnóstico'}
                subtitle={r.createdAt?.seconds
                  ? `Fecha: ${formatDate(new Date(r.createdAt.seconds * 1000))}`
                  : 'Fecha no disponible'}
              />
            </TouchableOpacity>
          ))
        )}
      </Section>

      <Section icon="card-outline" title="Pagos Realizados">
        {payments.length === 0 ? (
          <Text style={{ color: '#999' }}>Aún no has realizado pagos.</Text>
        ) : (
          payments.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => {
                if (p.status === 'pendiente') {
                  router.push(`/(tabs)/patient/payments/${p.id}/pay`);
                } else if (p.status === 'pagado' && !p.rating) {
                  router.push(`/(tabs)/patient/payments/${p.id}/review`);
                } else {
                  router.push(`/(tabs)/patient/payments/${p.id}`);
                }
              }}
            >
              <Card
                title={p.concept || 'Pago registrado'}
                subtitle={`Monto: $${p.amount || 0}`}
                badge={
                  p.status === 'pendiente'
                    ? 'Pendiente de pago'
                    : !p.rating && p.status === 'pagado'
                    ? 'Falta valoración'
                    : undefined
                }
              />
            </TouchableOpacity>
          ))
        )}
      </Section>
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
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: string;
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
      {badge && (
        <Text style={{ marginTop: 6, color: '#D97706', fontWeight: '600' }}>{badge}</Text>
      )}
    </View>
  );
}

function formatDate(date: Date) {
  return date.toLocaleString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
