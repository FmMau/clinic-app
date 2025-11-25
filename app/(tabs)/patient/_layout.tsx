import { HapticTab } from '@/components/HapticTab';
import { AnimatedTabIcon } from '@/components/ui/AnimatedTabIcon';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useUserRole } from '@/lib/firebase/useUserRole';
import { Tabs } from 'expo-router';
import { ComponentProps } from 'react';
import { Platform } from 'react-native';

function TabIcon(name: ComponentProps<typeof AnimatedTabIcon>['name']) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <AnimatedTabIcon name={name} size={size} color={color} focused={focused} />
  );
}

export default function PatientTabsLayout() {
  const { role, loading } = useUserRole();
  const colorScheme = useColorScheme();

  // Evita mostrar tabs si el rol está cargando o si no es paciente
  if (loading) return null;
  if (role !== 'paciente') return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#C7C7FF',
        tabBarStyle: {
          backgroundColor: '#4F46E5',
          borderTopWidth: 0,
          height: 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: TabIcon('home-outline'),
        }}
      />

      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Citas',
          tabBarIcon: TabIcon('calendar-outline'),
        }}
      />

      <Tabs.Screen
        name="payments"
        options={{
          title: 'Pagos',
          tabBarIcon: TabIcon('card-outline'),
        }}
      />

      <Tabs.Screen
        name="records"
        options={{
          title: 'Historial',
          tabBarIcon: TabIcon('book-outline'),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: TabIcon('person-outline'),
        }}
      />
    </Tabs>
  );
}
