import LoadingScreen from '@/components/ui/LoadingScreen';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { Stack } from 'expo-router';

export default function RecordsLayout() {
  const { loading: guardLoading, allowed } = useRoleGuard(['doctor']);

  if (guardLoading) return <LoadingScreen message="Cargando historial..." />;
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
      {/* Pantalla principal (lista de historiales) */}
      <Stack.Screen
        name="index"
        options={{ title: 'Historiales' }}
      />

      {/* Detalle del historial de un paciente */}
      <Stack.Screen
        name="[id]"
        options={({ route }) => ({
          // Si mandas `name` como param, el título cambia dinámicamente.
          title: (route.params as { name?: string })?.name || 'Historial',
        })}
      />
    </Stack>
  );
}
