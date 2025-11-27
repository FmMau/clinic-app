// lib/firebase/useRoleGuard.ts (o donde lo tengas)
import { useUserRole } from '@/lib/firebase/useUserRole';
import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';

export function useRoleGuard(allowedRoles: string[]) {
  const router = useRouter();
  const { role, loading } = useUserRole();

  const isAllowed = useMemo(
    () => allowedRoles.includes(role ?? ''),
    [allowedRoles, role]
  );

  useEffect(() => {
    if (!loading && role && !isAllowed) {
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
  }, [role, loading, isAllowed, router]);

  return { loading, allowed: isAllowed };
}
