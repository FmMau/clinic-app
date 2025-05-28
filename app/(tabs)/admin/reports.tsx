import { db } from '@/lib/firebase/firebaseConfig';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
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

export default function AdminReports() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const snap = await getDocs(collection(db, 'appointments'));
      const data = snap.docs.map((doc) => doc.data());
      setAppointments(data);
    };

    fetchAppointments();
  }, []);

  // KPIs
  const servicesCount: Record<string, number> = {};
  const dailyCounts: Record<string, number> = {};
  const monthlyTotals: Record<string, number> = {};

  appointments.forEach((a: any) => {
    if (a.service) {
      servicesCount[a.service] = (servicesCount[a.service] || 0) + 1;
    }
    if (a.createdAt) {
      const date = new Date(a.createdAt.seconds * 1000); // Firestore timestamp
      const dayKey = date.toISOString().split('T')[0];
      dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;

      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (a.amount || 0);
    }
  });

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return {
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      value: dailyCounts[key] || 0,
    };
  });

  const handleExportPDF = async () => {
    const html = `
      <h1>Reporte de Citas</h1>
      <p>Últimos 7 días:</p>
      <ul>
        ${last7Days
          .map((d) => `<li>${d.label}: ${d.value} citas</li>`)
          .join('')}
      </ul>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const handleExportCSV = async () => {
    const csvRows = [
      'Fecha,Citas',
      ...last7Days.map((d) => `${d.label},${d.value}`),
    ];
    const csv = csvRows.join('\n');
    const fileUri = FileSystem.cacheDirectory + 'citas.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Dashboard de Citas</Text>

      {/* KPI: Citas diarias (con alarma) */}
      <Text style={styles.sectionTitle}>Citas por día (últimos 7 días)</Text>
      <BarChart
        data={{
          labels: last7Days.map((d) => d.label),
          datasets: [
            {
              data: last7Days.map((d) => (d.value > CHART_LIMIT ? 0 : d.value)),
              color: (opacity = 1) => `rgba(90,92,255,${opacity})`,
            },
            {
              data: last7Days.map((d) => (d.value > CHART_LIMIT ? d.value : 0)),
              color: (opacity = 1) => `rgba(255,0,0,${opacity})`,
            },
          ],
        }}
        width={screenWidth - 20}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
        segments={5}
        showBarTops
        chartConfig={{
          ...chartConfig,
          decimalPlaces: 0,
        }}
        style={styles.chart}
      />

      <Text style={styles.kpiNote}>
        🔴 Alerta: se marca en rojo si se superan {CHART_LIMIT} citas por día.
      </Text>

      {/* KPI: Servicios más usados */}
      <Text style={styles.sectionTitle}>Servicios más utilizados</Text>
      <PieChart
        data={Object.entries(servicesCount).map(([label, value], index) => ({
          name: label,
          population: Number.isFinite(value) ? value : 0,
          color: `hsl(${index * 45}, 70%, 50%)`,
          legendFontColor: '#333',
          legendFontSize: 14,
        }))}
        width={screenWidth - 20}
        height={220}
        accessor={'population'}
        backgroundColor={'transparent'}
        paddingLeft={'15'}
        chartConfig={chartConfig}
        absolute
      />

      {/* Ingresos */}
      <Text style={styles.sectionTitle}>Ingresos mensuales</Text>
      <View style={styles.monthlyList}>
        {Object.entries(monthlyTotals).map(([month, total]) => (
          <Text key={month} style={styles.monthRow}>
            {month}: ${total.toFixed(2)}
          </Text>
        ))}
      </View>

      <View style={styles.exportContainer}>
        <TouchableOpacity onPress={handleExportPDF} style={styles.exportBtn}>
          <Text style={styles.exportText}>Exportar PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn}>
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
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 10,
    fontSize: 16,
  },
  kpiNote: {
    color: '#d00',
    marginTop: 4,
    fontSize: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 10,
  },
  monthlyList: {
    marginTop: 8,
    marginBottom: 24,
  },
  monthRow: {
    fontSize: 14,
    paddingVertical: 4,
  },
  exportContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 32,
  },
  exportBtn: {
    backgroundColor: '#5A5CFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
