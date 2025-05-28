import { db } from '@/lib/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    Dimensions,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    BarChart,
    LineChart,
    PieChart,
} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function AdminReports() {
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const snap = await getDocs(collection(db, 'appointments'));
      const data = snap.docs.map(doc => doc.data());
      setAppointments(data);
    };

    fetchAppointments();
  }, []);

  // Procesar datos
  const servicesCount: Record<string, number> = {};
  const monthlyTotals: Record<string, number> = {};
  const frequencyByService: Record<string, number> = {};

  appointments.forEach(a => {
    if (a.service) {
      servicesCount[a.service] = (servicesCount[a.service] || 0) + 1;
      frequencyByService[a.service] = (frequencyByService[a.service] || 0) + 1;
    }
    if (a.date && a.amount) {
      const date = a.date.toDate();
      const key = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
      monthlyTotals[key] = (monthlyTotals[key] || 0) + a.amount;
    }
  });

  const chartConfig = {
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(90, 92, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Reportes
      </Text>

      {/* Filtros visuales por ahora */}
      <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Filtros</Text>
      {['Fechas', 'Servicios', 'Médicos'].map((label, i) => (
        <TouchableOpacity
          key={i}
          style={{
            backgroundColor: '#f5f5f5',
            padding: 14,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: '#999' }}>Seleccionar {label}</Text>
        </TouchableOpacity>
      ))}

      {/* Pie Chart: Servicios usados */}
      <Text style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 6 }}>
        Servicios Usados
      </Text>
      <PieChart
        data={Object.entries(servicesCount).map(([key, value], i) => ({
          name: key,
          population: value,
          color: `hsl(${(i * 50) % 360}, 70%, 60%)`,
          legendFontColor: '#333',
          legendFontSize: 12,
        }))}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
        absolute
      />

      {/* Bar Chart: Frecuencia por servicio */}
      <Text style={{ fontWeight: 'bold', marginTop: 24, marginBottom: 6 }}>
        Frecuencia de Consultas
      </Text>
      <BarChart
        data={{
          labels: Object.keys(frequencyByService),
          datasets: [
            {
              data: Object.values(frequencyByService),
            },
          ],
        }}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        yAxisLabel=""
        yAxisSuffix=""
        style={{ marginVertical: 8, borderRadius: 16 }}
      />

      {/* Line Chart: Ingresos mensuales */}
      <Text style={{ fontWeight: 'bold', marginTop: 24, marginBottom: 6 }}>
        Tendencias de Ingresos
      </Text>
      <LineChart
        data={{
          labels: Object.keys(monthlyTotals),
          datasets: [
            {
              data: Object.values(monthlyTotals),
            },
          ],
        }}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />

      {/* Botones de exportación */}
      <View
        style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 }}
      >
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={styles.exportText}>Exportar PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={styles.exportText}>Exportar Excel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = {
  exportBtn: {
    backgroundColor: '#5A5CFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportText: {
    color: '#fff',
    fontWeight: '700' as const,
  },
};
