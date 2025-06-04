import { db } from "@/lib/firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export interface Appointment {
  service?: string;
  doctorId?: string;
  amount?: number;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const snap = await getDocs(collection(db, "appointments"));
        const data = snap.docs.map((doc) => doc.data() as Appointment);
        setAppointments(data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  return { appointments, loading };
}
