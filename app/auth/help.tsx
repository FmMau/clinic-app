import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { router } from 'expo-router';

export default function HelpScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Ayuda' }} />
      <ScrollView contentContainerStyle={styles.container} style={{ backgroundColor: '#fff' }}>
        <Text style={styles.sectionTitle}>Help Topics</Text>

        <View style={styles.card}>
          <Ionicons name="person-add-outline" size={20} color="#5A5CFF" style={styles.icon} />
          <Text style={styles.cardText}>Patient Registration</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="calendar-outline" size={20} color="#5A5CFF" style={styles.icon} />
          <Text style={styles.cardText}>Appointment Scheduling</Text>
        </View>
        <View style={styles.card}>
          <MaterialIcons name="folder-shared" size={20} color="#5A5CFF" style={styles.icon} />
          <Text style={styles.cardText}>Medical Records</Text>
        </View>

        <Text style={styles.sectionTitle}>FAQs</Text>

        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How do I reset my password?</Text>
          <Text style={styles.faqAnswer}>
            Click on ‘Forgot Password’ on the login screen and follow the instructions.
          </Text>
        </View>
        <View style={styles.faqCard}>
          <Text style={styles.faqQuestion}>How can I contact support?</Text>
          <Text style={styles.faqAnswer}>
            Use the contact options available at the bottom of this screen.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Contact Support</Text>

        <View style={styles.card}>
          <Ionicons name="mail-outline" size={20} color="#5A5CFF" style={styles.icon} />
          <Text style={styles.cardText}>support@medaccess.com</Text>
        </View>
        <View style={styles.card}>
          <Ionicons name="call-outline" size={20} color="#5A5CFF" style={styles.icon} />
          <Text style={styles.cardText}>+1-800-555-0199</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          style={styles.loginButton}
        >
          <Ionicons name="log-in-outline" size={20} color="white" />
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 32,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 14,
    borderRadius: 12,
  },
  cardText: {
    fontSize: 16,
    marginLeft: 12,
  },
  icon: {
    width: 24,
  },
  faqCard: {
    backgroundColor: '#F8F8F8',
    padding: 14,
    borderRadius: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6C6C6C',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    backgroundColor: '#5A5CFF',
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  loginText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
