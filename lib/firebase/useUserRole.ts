import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from './firebaseConfig';

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        // 1. Buscar en `users`
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          console.log('[useUserRole] Rol detectado en users:', data.role);
          setRole(data.role || null);
          setLoading(false);
          return;
        }

        // 2. Buscar en `patients`
        const patientRef = doc(db, 'patients', uid);
        const patientSnap = await getDoc(patientRef);

        if (patientSnap.exists()) {
          const data = patientSnap.data();
          console.log('[useUserRole] Rol detectado en patients:', data.role || 'paciente');
          setRole(data.role || 'paciente');
        } else {
          console.log('[useUserRole] No se encontró rol.');
        }
      } catch (err) {
        console.error('[useUserRole] Error al obtener rol:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, []);

  return { role, loading };
}
