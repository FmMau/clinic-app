import { auth, db } from '@/lib/firebase/firebaseConfig';
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
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    // 📅 Escuchar citas
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

    // 🧬 Escuchar historial
    const unsubscribeRecords = onSnapshot(
      query(
        collection(db, 'medicalRecords'),
        where('patientId', '==', uid),
        orderBy('date', 'desc')
      ),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecords(data.slice(0, 2));
      }
    );

    // 💳 Escuchar pagos
    const unsubscribePayments = onSnapshot(
      query(
        collection(db, 'payments'),
        where('patientId', '==', uid),
        orderBy('date', 'desc')
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
  }, [uid]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 40 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Bienvenida, Paciente
      </Text>

      {/* Botón agendar cita */}
      <TouchableOpacity
        onPress={() => router.push('/appointments/create')}
        style={{
          backgroundColor: '#5A5CFF',
          paddingVertical: 14,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Agendar nueva cita</Text>
      </TouchableOpacity>

      {/* Citas */}
      <Section title="Próximas Citas">
        {appointments.map((a) => (
          <TouchableOpacity key={a.id} onPress={() => router.push(`/appointments/${a.id}`)}>
            <Card title={a.doctor || 'Consulta'} subtitle={formatDate(a.date)} />
          </TouchableOpacity>
        ))}
      </Section>

      {/* Historial clínico */}
      <Section title="Historial Clínico">
        {records.map((r) => (
          <TouchableOpacity key={r.id} onPress={() => router.push(`/records/${r.id}`)}>
            <Card title={r.title} subtitle={`Resultado: ${r.result}`} />
          </TouchableOpacity>
        ))}
      </Section>

      {/* Pagos realizados */}
      <Section title="Pagos Realizados">
        {payments.map((p) => (
          <TouchableOpacity key={p.id} onPress={() => router.push(`/payments/${p.id}`)}>
            <Card title={p.concept} subtitle={`Monto: $${p.amount}`} />
          </TouchableOpacity>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>{title}</Text>
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
      <Text style={{ color: '#5A5CFF', fontWeight: 'bold', marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: '#333' }}>{subtitle}</Text>
    </View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
