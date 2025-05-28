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
import {
  BarChart,
  PieChart,
} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: (opacity = 1) => `rgba(90, 92, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#5A5CFF',
  },
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

  const servicesCount: Record<string, number> = {};
  const monthlyTotals: Record<string, number> = {};
  const frequencyByService: Record<string, number> = {};

  appointments.forEach((a: any) => {
    if (a.service) {
      servicesCount[a.service] = (servicesCount[a.service] || 0) + 1;
      frequencyByService[a.service] = (frequencyByService[a.service] || 0) + 1;
    }
    if (a.date && a.amount) {
      const date = a.date.toDate?.() || new Date(a.date); // soporte para Date y Timestamp
      const key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + a.amount;
    }
  });

  const handleExportPDF = async () => {
    const html = `
      <h1>Reporte de Consultas</h1>
      <p>Servicios usados:</p>
      <ul>
        ${Object.entries(servicesCount)
          .map(([s, v]) => `<li>${s}: ${v}</li>`)
          .join('')}
      </ul>
      <p>Ingresos mensuales:</p>
      <ul>
        ${Object.entries(monthlyTotals)
          .map(([m, v]) => `<li>${m}: $${v.toFixed(2)}</li>`)
          .join('')}
      </ul>
    `;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const handleExportCSV = async () => {
    const csvRows = [
      'Servicio,Total',
      ...Object.entries(servicesCount).map(([k, v]) => `${k},${v}`),
    ];
    const csv = csvRows.join('\n');
    const fileUri = FileSystem.cacheDirectory + 'reporte.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Reportes del sistema</Text>

      <Text style={styles.sectionTitle}>Servicios Usados</Text>
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

      <Text style={styles.sectionTitle}>Frecuencia de Consultas</Text>
      <BarChart
        data={{
          labels: Object.keys(frequencyByService),
          datasets: [{
            data: Object.values(frequencyByService).map(v =>
              Number.isFinite(v) ? v : 0
            ),
          }],
        }}
        width={screenWidth - 20}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        fromZero
        style={styles.chart}
      />

      <Text style={styles.sectionTitle}>Ingresos Mensuales</Text>
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
