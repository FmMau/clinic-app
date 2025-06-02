import { HapticTab } from '@/components/HapticTab';
import { AnimatedTabIcon } from '@/components/ui/AnimatedTabIcon';
import LoadingScreen from '@/components/ui/LoadingScreen';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function DoctorTabsLayout() {
  const colorScheme = useColorScheme();
  const { loading: guardLoading, allowed } = useRoleGuard(['doctor']);

  if (guardLoading) return <LoadingScreen message="Validando acceso..." />;
  if (!allowed) return null;

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
        title: 'Inicio',
        tabBarIcon: ({ color, size, focused }) => (
        <AnimatedTabIcon name="home-outline" size={size} color={color} focused={focused} />
        ),
      }}
      />
      <Tabs.Screen
      name="consultation"
      options={{
        title: 'Diagnostico',
        tabBarIcon: ({ color, size, focused }) => (
        <AnimatedTabIcon name="medkit-outline" size={size} color={color} focused={focused} />
        ),
      }}
      />
      <Tabs.Screen
      name="records"
      options={{
        title: 'Historiales',
        tabBarIcon: ({ color, size, focused }) => (
        <AnimatedTabIcon name="document-text-outline" size={size} color={color} focused={focused} />
        ),
      }}
      />
      <Tabs.Screen
      name="payments"
      options={{
        title: 'Pagos',
        tabBarIcon: ({ color, size, focused }) => (
        <AnimatedTabIcon name="cash-outline" size={size} color={color} focused={focused} />
        ),
      }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="person-outline" size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
