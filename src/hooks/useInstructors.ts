import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';
import { Instructor } from '../types';

export function useInstructors() {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstructors = useCallback(async () => {
    if (!user) {
      setInstructors([]);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/instructors");
      if (res.success && res.instructors) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = res.instructors.map((i: any) => ({
          ...i,
          id: i._id,
        })) as Instructor[];
        setInstructors(mapped);
      }
    } catch (error) {
      console.error("Error fetching instructors:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInstructors();

    const handleMutation = () => {
      fetchInstructors();
    };

    window.addEventListener("instructor-mutation", handleMutation);
    return () => {
      window.removeEventListener("instructor-mutation", handleMutation);
    };
  }, [fetchInstructors]);

  return { instructors, loading, refetch: fetchInstructors };
}
export type UseInstructorsReturn = ReturnType<typeof useInstructors>;
