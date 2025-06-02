import { db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;
const CHART_LIMIT = 40;

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(90, 92, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

type Appointment = {
  service?: string;
  createdAt?: { seconds: number };
  doctorId?: string;
  doctor?: string;
};

type Doctor = {
  name: string;
};

type Payment = {
  amount: number;
  appointmentId: string;
  createdAt?: { seconds: number };
};

export default function AdminReports() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorMap, setDoctorMap] = useState<Record<string, string>>({});
  const [payments, setPayments] = useState<Payment[]>([]);
  const today = new Date();
  const yearMonthKey = today.toISOString().slice(0, 7);
  const monthName = today.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar citas y doctores
        const [appointmentsSnap, doctorsSnap, paymentsSnap] = await Promise.all([
          getDocs(collection(db, 'appointments')),
          getDocs(collection(db, 'doctors')),
          getDocs(collection(db, 'payments')),
        ]);

        const appointmentData = appointmentsSnap.docs.map((doc) => doc.data() as Appointment);
        setAppointments(appointmentData);

        const doctorData: Record<string, string> = {};
        doctorsSnap.forEach((doc) => {
          const data = doc.data() as Doctor;
          doctorData[doc.id] = data.name;
        });
        setDoctorMap(doctorData);

        const paymentData = paymentsSnap.docs.map((doc) => doc.data() as Payment);
        setPayments(paymentData);

      } catch (error) {
        Alert.alert('Error', 'No se pudieron obtener los datos.');
      }
    };

    fetchData();
  }, []);

  const { last7Days, servicesCount, monthlyTotals, doctorCounts } = useMemo(() => {
    const services: Record<string, number> = {};
    const daily: Record<string, number> = {};
    const monthly: Record<string, number> = {};
    const doctors: Record<string, number> = {};

    // Contar servicios y citas por día y doctor con base en appointments
    appointments.forEach((a) => {
      if (a.service) services[a.service] = (services[a.service] || 0) + 1;

      if (a.createdAt?.seconds) {
        const date = new Date(a.createdAt.seconds * 1000);
        const dayKey = date.toISOString().split('T')[0];
        daily[dayKey] = (daily[dayKey] || 0) + 1;
      }

      if (a.doctorId) {
        const name =
          a.doctor || doctorMap[a.doctorId] || 'Desconocido';
        doctors[name] = (doctors[name] || 0) + 1;
      }

    });

    // Sumar ingresos mensuales con base en payments
    payments.forEach((p) => {
      if (p.createdAt?.seconds) {
        const date = new Date(p.createdAt.seconds * 1000);
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthly[monthKey] = (monthly[monthKey] || 0) + (p.amount || 0);
      }
    });

    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      return {
        label: `${d.getDate()}/${d.getMonth() + 1}`,
        value: daily[key] || 0,
      };
    });

    return {
      last7Days: last7,
      servicesCount: services,
      monthlyTotals: monthly,
      doctorCounts: doctors,
    };
  }, [appointments, payments, doctorMap]);

  const handleExportPDF = async () => {
    try {
      const html = `
        <h1>Reporte de Citas</h1>
        <p>Últimos 7 días:</p>
        <ul>
          ${last7Days.map((d) => `<li>${d.label}: ${d.value} citas</li>`).join('')}
        </ul>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert('Error', 'No se pudo exportar el PDF.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = [
        'Fecha,Citas',
        ...last7Days.map((d) => `${d.label},${d.value}`),
      ].join('\n');
      const uri = FileSystem.cacheDirectory + 'reporte.csv';
      await FileSystem.writeAsStringAsync(uri, csv);
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert('Error', 'No se pudo exportar el CSV.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>

      {/* Citas por Día */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar" size={20} color="#5A5CFF" />
          <Text style={styles.cardTitle}>Citas por Día</Text>
        </View>
        <BarChart
          data={{
            labels: last7Days.map((d) => d.label),
            datasets: [
              {
                data: last7Days.map((d) => (d.value > CHART_LIMIT ? 0 : d.value)),
                color: () => '#5A5CFF',
              },
              {
                data: last7Days.map((d) => (d.value > CHART_LIMIT ? d.value : 0)),
                color: () => '#FF4D4F',
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          fromZero
          withInnerLines={false}
          chartConfig={{ ...chartConfig, decimalPlaces: 0 }}
          yAxisLabel=""
          yAxisSuffix=" citas"
          style={styles.chart}
        />
        <Text style={styles.note}>🔴 Días con más de {CHART_LIMIT} citas en rojo</Text>
      </View>

      {/* Citas por Doctor */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="people" size={20} color="#5A5CFF" />
          <Text style={styles.cardTitle}>Citas por Doctor</Text>
        </View>
        <PieChart
          data={Object.entries(doctorCounts).map(([name, count], index) => ({
            name,
            population: count,
            color: `hsl(${index * 45}, 60%, 55%)`,
            legendFontColor: '#333',
            legendFontSize: 12,
          }))}
          width={screenWidth - 40}
          height={220}
          accessor={'population'}
          backgroundColor={'transparent'}
          paddingLeft={'15'}
          chartConfig={chartConfig}
        />
      </View>

      {/* Ingresos Mensuales */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="cash" size={20} color="#5A5CFF" />
          <Text style={styles.cardTitle}>Ingresos Mensuales</Text>
        </View>

        {monthlyTotals[yearMonthKey] !== undefined ? (
          <Text style={styles.incomeItem}>
            {monthName}: ${monthlyTotals[yearMonthKey].toFixed(2)}
          </Text>
        ) : (
          <Text style={styles.incomeItem}>No hay datos para este mes</Text>
        )}
      </View>

      {/* Botones de Exportación */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
          <Ionicons name="document-text-outline" size={16} color="white" />
          <Text style={styles.exportText}>Exportar PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn}>
          <Ionicons name="cloud-download-outline" size={16} color="white" />
          <Text style={styles.exportText}>Exportar CSV</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#f9f9ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  chart: {
    marginTop: 8,
    borderRadius: 12,
  },
  note: {
    fontSize: 12,
    color: '#d00',
    marginTop: 6,
  },
  incomeItem: {
    fontSize: 14,
    paddingVertical: 2,
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5A5CFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
