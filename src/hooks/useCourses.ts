import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';
import { Course } from '../types';

export function useCourses(ownerFilter?: string) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = useCallback(async () => {
    if (!user) {
      setCourses([]);
      setLoading(false);
      return;
    }

    try {
      const url = ownerFilter ? `/courses?ownerFilter=${encodeURIComponent(ownerFilter)}` : "/courses";
      const res = await apiFetch(url);
      if (res.success && res.courses) {
        const mapped = res.courses.map((c: Omit<Course, 'id'> & { _id: string }) => ({
          ...c,
          id: c._id,
        })) as Course[];
        setCourses(mapped);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  }, [user, ownerFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCourses();

    const handleMutation = () => {
      fetchCourses();
    };

    window.addEventListener("course-mutation", handleMutation);
    return () => {
      window.removeEventListener("course-mutation", handleMutation);
    };
  }, [fetchCourses]);

  return { courses, loading, refetch: fetchCourses };
}
export type UseCoursesReturn = ReturnType<typeof useCourses>;
