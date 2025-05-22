import { auth, db } from '@/lib/firebase/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AnimatedSwipeable from 'react-native-gesture-handler/Swipeable';

export default function DoctorDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const patientSnap = await getDocs(collection(db, 'patients'));
      const appointmentSnap = await getDocs(
        query(
          collection(db, 'appointments'),
          where('date', '>=', Timestamp.fromDate(today)),
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
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('doctorId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const updated = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(updated);
    });

    return unsubscribe;
  }, []);

  const fadeAnimRefs = useRef<{ [key: string]: Animated.Value }>({});

  const handleDelete = async (id: string) => {
    const anim = fadeAnimRefs.current[id];
    if (anim) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(async () => {
        try {
          await deleteDoc(doc(db, 'notifications', id));
        } catch (err) {
          Alert.alert('Error', 'No se pudo eliminar la notificación');
        }
      });
    }
  };

  const renderRightActions = (id: string) => (
    <TouchableOpacity onPress={() => handleDelete(id)} style={styles.swipeAction}>
      <Ionicons name="trash-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Eliminar</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        ListHeaderComponent={
          <View style={{ padding: 24, gap: 24 }}>
            <Text style={styles.title}>Citas del día</Text>
            {loading ? <ActivityIndicator size="large" color="#5A5CFF" /> : (
              <View style={styles.card}>
                {appointments.map((a) => (
                  <View key={a.id} style={styles.row}>
                    <Text>{a.time} - {a.patientName}</Text>
                    <Text style={{ color: '#5A5CFF' }}>{a.status}</Text>
                  </View>
                ))}
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
              onPress={() => router.push('/(tabs)/doctor/consultation/select')}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Agregar diagnóstico</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Notificaciones</Text>
          </View>
        }
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (!fadeAnimRefs.current[item.id]) {
            fadeAnimRefs.current[item.id] = new Animated.Value(1);
          }
          return (
            <AnimatedSwipeable renderRightActions={() => renderRightActions(item.id)}>
              <Animated.View style={{ opacity: fadeAnimRefs.current[item.id] }}>
                <View style={styles.notificationItem}>
                  <Text style={{ flex: 1 }}>{item.message}</Text>
                  <Ionicons
                    name={item.type === 'success' ? 'checkmark-circle-outline' : item.type === 'error' ? 'close-circle-outline' : 'notifications-outline'}
                    size={20}
                    color={item.type === 'success' ? '#22C55E' : item.type === 'error' ? '#EF4444' : '#5A5CFF'}
                  />
                </View>
              </Animated.View>
            </AnimatedSwipeable>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 12 }}>Sin notificaciones nuevas</Text>}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
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
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  swipeAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
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
