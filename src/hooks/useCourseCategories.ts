import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from './useAuth';

export interface CourseCategoryItem {
  id: string;
  name: string;
}

export function useCourseCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CourseCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/courses/categories");
      if (res.success && res.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped = res.data.map((cat: any) => ({
          id: cat._id,
          name: cat.name,
        }));
        setCategories(mapped);
      }
    } catch (error) {
      console.error("Error fetching course categories:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();

    const handleMutation = () => {
      fetchCategories();
    };

    window.addEventListener("course-category-mutation", handleMutation);
    return () => {
      window.removeEventListener("course-category-mutation", handleMutation);
    };
  }, [fetchCategories]);

  return { categories, loading, refetch: fetchCategories };
}
