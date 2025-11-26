import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Stack } from 'expo-router';

export default function PaymentsLayout() {
  const { loading: guardLoading, allowed } = useRoleGuard(['doctor']);

  if (guardLoading) return <LoadingScreen message="Cargando pagos..." />;
  if (!allowed) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        headerStyle: {
          backgroundColor: '#5A5CFF',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Pagos' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalle del pago' }}
      />
      <Stack.Screen
        name="create"
        options={{ title: 'Crear pago' }}
      />
    </Stack>
  );
}
