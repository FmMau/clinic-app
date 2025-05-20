import { useUserRole } from '@/lib/firebase/useUserRole';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function useRoleGuard(allowedRoles: string[]) {
  const router = useRouter();
  const { role, loading } = useUserRole();

  useEffect(() => {
    if (!loading) {
      if (!allowedRoles.includes(role ?? '')) {
        // Redirige a su pantalla válida
        switch (role) {
          case 'paciente':
            router.replace('/(tabs)/patient');
            break;
          case 'doctor':
            router.replace('/(tabs)/doctor');
            break;
          case 'admin':
            router.replace('/(tabs)/admin');
            break;
          default:
            router.replace('/auth/login');
        }
      }
    }
  }, [role, loading]);
}
