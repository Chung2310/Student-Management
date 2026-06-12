import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';
import { Student } from '../types';

export function useStudents() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    if (!user) {
      setStudents([]);
      setLoading(false);
      return;
    }
    
    try {
      const res = await apiFetch("/students");
      if (res.success && res.students) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = res.students.map((s: any) => ({
          ...s,
          id: s._id,
        })) as Student[];
        setStudents(mapped);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStudents();

    const handleMutation = () => {
      fetchStudents();
    };

    window.addEventListener("student-mutation", handleMutation);
    return () => {
      window.removeEventListener("student-mutation", handleMutation);
    };
  }, [fetchStudents]);

  return { students, loading, refetch: fetchStudents };
}
export type UseStudentsReturn = ReturnType<typeof useStudents>;
