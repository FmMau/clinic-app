import { HapticTab } from '@/components/HapticTab';
import { AnimatedTabIcon } from '@/components/ui/AnimatedTabIcon';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function AdminLayout() {
  const colorScheme = useColorScheme();

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
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon name="home-outline" size={size} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
